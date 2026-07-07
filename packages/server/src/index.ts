import cors from 'cors';
import express from 'express';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const DEFAULT_BASE = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
const DEFAULT_KEY = process.env.AI_API_KEY || '';
const DEFAULT_MODEL = process.env.AI_MODEL || 'gpt-4o';
const OPENCLAW_DEFAULT_PERSONA_ID = process.env.OPENCLAW_DEFAULT_PERSONA_ID || 'default';
const OPENCLAW_DEFAULT_SYSTEM_PROMPT = process.env.OPENCLAW_DEFAULT_SYSTEM_PROMPT || '你是一个自然、可靠的微信聊天助手。回复尽量简洁，使用中文。';
const OPENCLAW_MAX_HISTORY = Number(process.env.OPENCLAW_MAX_HISTORY || 20);

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

type ProviderPayload = {
  endpoint?: string;
  apiKey?: string;
  authMode?: 'bearer' | 'none';
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

type PersonaPayload = {
  id?: string;
  name?: string;
  systemPrompt?: string;
  provider?: ProviderPayload;
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

type OpenClawSession = {
  sessionId: string;
  personaId: string;
  history: ChatMessage[];
  updatedAt: number;
};

const openClawSessions = new Map<string, OpenClawSession>();

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

function resolveProvider(body: any): Required<ProviderPayload> {
  const provider = body.provider || {};
  return {
    endpoint: provider.endpoint || body.endpoint || DEFAULT_BASE,
    apiKey: provider.apiKey || body.apiKey || DEFAULT_KEY,
    authMode: provider.authMode || body.authMode || 'bearer',
    model: provider.model || body.model || DEFAULT_MODEL,
    temperature: provider.temperature ?? body.temperature ?? 0.8,
    maxTokens: provider.maxTokens || body.maxTokens || body.max_tokens || 1200,
  };
}

function resolvePersona(body: any): PersonaPayload {
  const persona = body.persona || {};
  return {
    id: persona.id || body.personaId || OPENCLAW_DEFAULT_PERSONA_ID,
    name: persona.name || body.personaName || '默认角色',
    systemPrompt: persona.systemPrompt || body.systemPrompt || OPENCLAW_DEFAULT_SYSTEM_PROMPT,
    provider: persona.provider,
    model: persona.model || body.model,
    temperature: persona.temperature ?? body.temperature,
    maxTokens: persona.maxTokens || body.maxTokens,
  };
}

async function streamOpenAICompatible(req: express.Request, res: express.Response) {
  const body = req.body || {};
  const provider = resolveProvider(body);
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

  if (provider.authMode !== 'none' && !provider.apiKey) {
    writeEvent(res, { event: 'error', data: { message: '缺少 API Key。请在设置中填写，或配置 AI_API_KEY 环境变量。' } });
    res.end();
    return;
  }

  try {
    writeEvent(res, { event: 'state', data: { state: 'thinking' } });
    const upstream = await fetch(`${normalizeBase(provider.endpoint)}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(provider.apiKey, provider.authMode),
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        stream: true,
        temperature: provider.temperature,
        max_tokens: provider.maxTokens,
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

async function completeOpenAICompatible(provider: Required<ProviderPayload>, messages: ChatMessage[]): Promise<string> {
  if (provider.authMode !== 'none' && !provider.apiKey) {
    throw new Error('缺少 API Key。请配置 AI_API_KEY，或在请求中传入 provider.apiKey。');
  }

  const upstream = await fetch(`${normalizeBase(provider.endpoint)}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(provider.apiKey, provider.authMode),
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      stream: false,
      temperature: provider.temperature,
      max_tokens: provider.maxTokens,
    }),
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '');
    throw new Error(text || `模型接口错误：${upstream.status}`);
  }

  const data = await upstream.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim() || '';
}

app.post('/api/chat', streamOpenAICompatible);

app.post('/api/models', async (req, res) => {
  const provider = resolveProvider(req.body || {});

  if (provider.authMode !== 'none' && !provider.apiKey) {
    res.status(400).json({ models: [], error: '缺少 API Key。' });
    return;
  }

  try {
    const upstream = await fetch(`${normalizeBase(provider.endpoint)}/v1/models`, {
      headers: authHeaders(provider.apiKey, provider.authMode),
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

app.post('/api/openclaw/chat', async (req, res) => {
  const body = req.body || {};
  const message = String(body.message || body.text || '').trim();
  if (!message) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  const persona = resolvePersona(body);
  const provider = resolveProvider({
    ...body,
    provider: persona.provider || body.provider,
    model: persona.model || body.model,
    temperature: persona.temperature ?? body.temperature,
    maxTokens: persona.maxTokens || body.maxTokens,
  });
  const sessionId = String(body.sessionId || body.userId || body.from || 'default');
  const personaId = String(persona.id || OPENCLAW_DEFAULT_PERSONA_ID);
  const sessionKey = `${personaId}:${sessionId}`;
  const session = openClawSessions.get(sessionKey) || {
    sessionId,
    personaId,
    history: [],
    updatedAt: Date.now(),
  };

  const messages: ChatMessage[] = [
    { role: 'system', content: persona.systemPrompt || OPENCLAW_DEFAULT_SYSTEM_PROMPT },
    ...session.history.slice(-OPENCLAW_MAX_HISTORY),
    { role: 'user', content: message },
  ];

  try {
    const reply = await completeOpenAICompatible(provider, messages);
    session.history = [
      ...session.history,
      { role: 'user', content: message },
      { role: 'assistant', content: reply },
    ].slice(-OPENCLAW_MAX_HISTORY);
    session.updatedAt = Date.now();
    openClawSessions.set(sessionKey, session);

    res.json({
      reply,
      message: reply,
      sessionId,
      personaId,
      model: provider.model,
      historySize: session.history.length,
    });
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'OpenClaw bridge request failed',
      sessionId,
      personaId,
    });
  }
});

app.post('/api/openclaw/clear', (req, res) => {
  const sessionId = req.body?.sessionId ? String(req.body.sessionId) : '';
  const personaId = req.body?.personaId ? String(req.body.personaId) : '';

  if (!sessionId && !personaId) {
    const count = openClawSessions.size;
    openClawSessions.clear();
    res.json({ ok: true, cleared: count });
    return;
  }

  let cleared = 0;
  for (const [key, session] of openClawSessions.entries()) {
    if ((sessionId && session.sessionId !== sessionId) || (personaId && session.personaId !== personaId)) continue;
    openClawSessions.delete(key);
    cleared += 1;
  }
  res.json({ ok: true, cleared });
});

app.get('/api/openclaw/sessions', (_req, res) => {
  res.json({
    sessions: [...openClawSessions.values()].map((session) => ({
      sessionId: session.sessionId,
      personaId: session.personaId,
      historySize: session.history.length,
      updatedAt: session.updatedAt,
    })),
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'nic-chat-server' });
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`NIC-CHAT server listening at http://localhost:${PORT}`);
});
