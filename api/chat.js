export const config = { runtime: 'edge' };

function normalizeBase(endpoint) {
  return endpoint.replace(/\/+$/, '').replace(/\/v1$/, '');
}

function authHeaders(apiKey, authMode) {
  if (authMode === 'none') return {};
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
}

function sse(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const body = await request.json().catch(() => ({}));
  const authMode = body.authMode || 'bearer';
  const apiKey = body.apiKey || process.env.AI_API_KEY || '';
  const endpoint = body.endpoint || process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const model = body.model || 'gpt-4o';
  const systemPrompt = body.systemPrompt || '';
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...(body.messages || []),
  ];

  if (authMode !== 'none' && !apiKey) {
    return new Response(
      sse('error', { message: '缺少 API Key。请在环境变量或设置中配置。' }),
      { headers: { 'Content-Type': 'text/event-stream', 'Access-Control-Allow-Origin': '*' } },
    );
  }

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

  if (!upstream.ok || !upstream.body) {
    return new Response(
      sse('error', { message: `模型接口错误：${upstream.status}` }),
      { status: 200, headers: { 'Content-Type': 'text/event-stream', 'Access-Control-Allow-Origin': '*' } },
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      controller.enqueue(encoder.encode(':connected\n\n'));
      controller.enqueue(encoder.encode(sse('state', { state: 'answering' })));

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
              if (delta?.reasoning_content) controller.enqueue(encoder.encode(sse('thinking', { text: delta.reasoning_content })));
              if (delta?.content) controller.enqueue(encoder.encode(sse('text', { text: delta.content })));
            } catch {
              // Ignore malformed partial chunks.
            }
          }
        }
        controller.enqueue(encoder.encode(sse('state', { state: 'completed' })));
      } catch (error) {
        controller.enqueue(encoder.encode(sse('error', { message: error instanceof Error ? error.message : '网关请求失败。' })));
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
