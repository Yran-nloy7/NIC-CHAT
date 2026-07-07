export const config = { runtime: 'edge' };

const sessions = new Map();

function normalizeBase(endpoint) {
  return endpoint.replace(/\/+$/, '').replace(/\/v1$/, '');
}

function authHeaders(apiKey, authMode) {
  if (authMode === 'none') return {};
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
}

function resolveProvider(body) {
  const provider = body.provider || {};
  return {
    endpoint: provider.endpoint || body.endpoint || process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: provider.apiKey || body.apiKey || process.env.AI_API_KEY || '',
    authMode: provider.authMode || body.authMode || 'bearer',
    model: provider.model || body.model || process.env.AI_MODEL || 'gpt-4o',
    temperature: provider.temperature ?? body.temperature ?? 0.8,
    maxTokens: provider.maxTokens || body.maxTokens || body.max_tokens || 1200,
  };
}

async function complete(provider, messages) {
  if (provider.authMode !== 'none' && !provider.apiKey) {
    throw new Error('缺少 API Key。');
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

  const data = await upstream.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const body = await request.json().catch(() => ({}));
  const message = String(body.message || body.text || '').trim();
  if (!message) {
    return Response.json({ error: 'message is required' }, { status: 400 });
  }

  const persona = body.persona || {};
  const personaId = String(persona.id || body.personaId || process.env.OPENCLAW_DEFAULT_PERSONA_ID || 'default');
  const sessionId = String(body.sessionId || body.userId || body.from || 'default');
  const sessionKey = `${personaId}:${sessionId}`;
  const systemPrompt = persona.systemPrompt || body.systemPrompt || process.env.OPENCLAW_DEFAULT_SYSTEM_PROMPT || '你是一个自然、可靠的微信聊天助手。回复尽量简洁，使用中文。';
  const maxHistory = Number(process.env.OPENCLAW_MAX_HISTORY || 20);
  const session = sessions.get(sessionKey) || { history: [] };

  const provider = resolveProvider({
    ...body,
    provider: persona.provider || body.provider,
    model: persona.model || body.model,
    temperature: persona.temperature ?? body.temperature,
    maxTokens: persona.maxTokens || body.maxTokens,
  });

  const messages = [
    { role: 'system', content: systemPrompt },
    ...session.history.slice(-maxHistory),
    { role: 'user', content: message },
  ];

  try {
    const reply = await complete(provider, messages);
    session.history = [
      ...session.history,
      { role: 'user', content: message },
      { role: 'assistant', content: reply },
    ].slice(-maxHistory);
    sessions.set(sessionKey, session);

    return Response.json({
      reply,
      message: reply,
      sessionId,
      personaId,
      model: provider.model,
      historySize: session.history.length,
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'OpenClaw bridge request failed',
      sessionId,
      personaId,
    }, { status: 502 });
  }
}
