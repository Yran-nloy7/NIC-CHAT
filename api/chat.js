/**
 * Vercel Edge Function — streams AI API responses.
 * Edge runtime supports Web Streams natively = no SSE buffering.
 */

export const config = { runtime: 'edge' };

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const body = await request.json().catch(() => ({}));
  const apikey = body.apiKey || '';
  const model = body.model || 'gpt-4o';
  const messages = body.messages || [];
  const endpoint = body.endpoint || 'https://paw.v1chat.cc/v1';
  const temperature = body.temperature;
  const maxTokens = body.max_tokens;

  if (!apikey) {
    return new Response(JSON.stringify({ error: 'API Key required' }), { status: 400 });
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
      return new Response(err, { status: upstream.status });
    }

    // Stream the response — Edge runtime natively supports ReadableStream
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Upstream failed: ' + err.message }), { status: 502 });
  }
}
