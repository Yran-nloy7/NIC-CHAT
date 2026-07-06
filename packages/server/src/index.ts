import cors from 'cors';
import express from 'express';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const DEFAULT_BASE = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
const DEFAULT_KEY = process.env.AI_API_KEY || '';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type GatewayEvent =
  | { event: 'state'; data: { state: 'thinking' | 'answering' | 'completed' } }
  | { event: 'text'; data: { text: string } }
  | { event: 'thinking'; data: { text: string } }
  | { event: 'tool_call'; data: { name?: string; arguments?: string } }
  | { event: 'error'; data: { message: string } };

function normalizeBase(endpoint: string): string {
  return endpoint.replace(/\/+$/, '').replace(/\/v1$/, '');
}

function authHeaders(apiKey: string, authMode?: string): Record<string, string> {
  if (authMode === 'none') return {};
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
}

function writeEvent(res: express.Response, event: GatewayEvent) {
  res.write(`event: ${event.event}\n`);
  res.write(`data: ${JSON.stringify(event.data)}\n\n`);
}

async function streamOpenAICompatible(req: express.Request, res: express.Response) {
  const body = req.body || {};
  const authMode = body.authMode || 'bearer';
  const apiKey = body.apiKey || DEFAULT_KEY;
  const endpoint = body.endpoint || DEFAULT_BASE;
  const model = body.model || 'gpt-4o';
  const systemPrompt = body.systemPrompt || '';
  const messages: ChatMessage[] = [
    ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
    ...((body.messages || []) as ChatMessage[]),
  ];

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(':connected\n\n');

  if (authMode !== 'none' && !apiKey) {
    writeEvent(res, { event: 'error', data: { message: '缺少 API Key。请在设置中填写，或配置 AI_API_KEY 环境变量。' } });
    res.end();
    return;
  }

  try {
    writeEvent(res, { event: 'state', data: { state: 'thinking' } });
    const upstream = await fetch(`${normalizeBase(endpoint)}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(apiKey, authMode),
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: body.temperature,
        max_tokens: body.maxTokens || body.max_tokens,
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      writeEvent(res, { event: 'error', data: { message: text || `模型接口错误：${upstream.status}` } });
      res.end();
      return;
    }
    if (!upstream.body) {
      writeEvent(res, { event: 'error', data: { message: '模型接口没有返回可读流。' } });
      res.end();
      return;
    }

    writeEvent(res, { event: 'state', data: { state: 'answering' } });
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.reasoning_content) writeEvent(res, { event: 'thinking', data: { text: delta.reasoning_content } });
            if (delta?.content) writeEvent(res, { event: 'text', data: { text: delta.content } });
            if (delta?.tool_calls) {
              for (const call of delta.tool_calls) {
                writeEvent(res, { event: 'tool_call', data: { name: call.function?.name, arguments: call.function?.arguments } });
              }
            }
          } catch {
            // Skip malformed partial payloads from upstream providers.
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    writeEvent(res, { event: 'state', data: { state: 'completed' } });
    res.end();
  } catch (error) {
    writeEvent(res, { event: 'error', data: { message: error instanceof Error ? error.message : '网关请求失败。' } });
    res.end();
  }
}

app.post('/api/chat', streamOpenAICompatible);

app.post('/api/models', async (req, res) => {
  const body = req.body || {};
  const authMode = body.authMode || 'bearer';
  const apiKey = body.apiKey || DEFAULT_KEY;
  const endpoint = body.endpoint || DEFAULT_BASE;

  if (authMode !== 'none' && !apiKey) {
    res.status(400).json({ models: [], error: '缺少 API Key。' });
    return;
  }

  try {
    const upstream = await fetch(`${normalizeBase(endpoint)}/v1/models`, {
      headers: authHeaders(apiKey, authMode),
    });
    if (!upstream.ok) {
      res.status(upstream.status).json({ models: [], error: `模型列表读取失败：${upstream.status}` });
      return;
    }
    const data = await upstream.json() as { data?: Array<{ id: string; name?: string; owned_by?: string }> };
    res.json({
      models: (data.data || []).map((item) => ({
        id: item.id,
        name: item.name || item.id,
        ownedBy: item.owned_by,
      })),
    });
  } catch (error) {
    res.status(502).json({ models: [], error: error instanceof Error ? error.message : '模型列表读取失败。' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'nic-chat-server' });
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`NIC-CHAT server listening at http://localhost:${PORT}`);
});
