/**
 * Cloudflare Pages Function — proxies AI API calls with streaming.
 * Deployed at: https://<your-project>.pages.dev/api/chat
 */

export async function onRequest(context) {
  const { request } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const apikey = body.apiKey || '';
  const model = body.model || 'gpt-4o';
  const messages = body.messages || [];
  const endpoint = body.endpoint || 'https://paw.v1chat.cc/v1';
  const temperature = body.temperature;
  const maxTokens = body.max_tokens;

  if (!apikey) {
    return new Response(JSON.stringify({ error: 'API Key required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const base = endpoint.replace(/\/+$/, '').replace(/\/v1$/, '');
  const targetUrl = `${base}/v1/chat/completions`;

  const reqBody = { model, messages, stream: true };
  if (temperature !== undefined) reqBody.temperature = temperature;
  if (maxTokens) reqBody.max_tokens = maxTokens;

  try {
    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apikey}`,
      },
      body: JSON.stringify(reqBody),
    });

    if (!upstream.ok) {
      const err = await upstream.text().catch(() => '');
      return new Response(err, {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Stream the response — Cloudflare Workers support ReadableStream
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Upstream failed: ' + err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
