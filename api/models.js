export const config = { runtime: 'edge' };

function normalizeBase(endpoint) {
  return endpoint.replace(/\/+$/, '').replace(/\/v1$/, '');
}

function authHeaders(apiKey, authMode) {
  if (authMode === 'none') return {};
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
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

  if (authMode !== 'none' && !apiKey) {
    return Response.json({ models: [], error: '缺少 API Key。' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${normalizeBase(endpoint)}/v1/models`, {
      headers: authHeaders(apiKey, authMode),
    });
    if (!upstream.ok) {
      return Response.json({ models: [], error: `模型列表读取失败：${upstream.status}` }, { status: upstream.status });
    }
    const data = await upstream.json();
    return Response.json({
      models: (data.data || []).map((item) => ({
        id: item.id,
        name: item.name || item.id,
        ownedBy: item.owned_by,
      })),
    });
  } catch (error) {
    return Response.json({ models: [], error: error instanceof Error ? error.message : '模型列表读取失败。' }, { status: 502 });
  }
}
