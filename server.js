/**
 * Lightweight local server for the built docs folder and /api/chat proxy.
 * Prefer `pnpm dev` during development.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const DEFAULT_BASE = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
const DEFAULT_KEY = process.env.AI_API_KEY || '';
const DOCS_DIR = path.join(__dirname, 'docs');

function normalizeBase(endpoint) {
  return endpoint.replace(/\/+$/, '').replace(/\/v1$/, '');
}

function sendSSE(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function proxyChat(req, res, body) {
  const apiKey = body.apiKey || DEFAULT_KEY;
  if (!apiKey) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    sendSSE(res, 'error', { message: 'Missing API key. Set AI_API_KEY or configure a provider in the UI.' });
    res.end();
    return;
  }

  const base = normalizeBase(body.endpoint || DEFAULT_BASE);
  const target = new URL(`${base}/v1/chat/completions`);
  const messages = [
    ...(body.systemPrompt ? [{ role: 'system', content: body.systemPrompt }] : []),
    ...(body.messages || []),
  ];
  const payload = JSON.stringify({
    model: body.model || 'gpt-4o',
    messages,
    stream: true,
    temperature: body.temperature,
    max_tokens: body.maxTokens || body.max_tokens,
  });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(':connected\n\n');

  const upstream = https.request({
    hostname: target.hostname,
    port: target.port || 443,
    path: target.pathname + target.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(payload),
      Accept: 'text/event-stream',
    },
  }, (upstreamRes) => {
    let buffer = '';
    upstreamRes.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === '[DONE]') continue;
        try {
          const parsed = JSON.parse(raw);
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.reasoning_content) sendSSE(res, 'thinking', { text: delta.reasoning_content });
          if (delta?.content) sendSSE(res, 'text', { text: delta.content });
        } catch {
          // Ignore malformed chunks.
        }
      }
    });
    upstreamRes.on('end', () => {
      sendSSE(res, 'state', { state: 'completed' });
      res.end();
    });
  });

  upstream.on('error', (error) => {
    sendSSE(res, 'error', { message: error.message });
    res.end();
  });
  upstream.write(payload);
  upstream.end();
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => proxyChat(req, res, JSON.parse(body || '{}')));
    return;
  }

  const requested = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(DOCS_DIR, requested || '');
  if (!filePath.startsWith(DOCS_DIR) || !fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }
  res.writeHead(200);
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`NIC-CHAT local server: http://localhost:${PORT}`);
});
