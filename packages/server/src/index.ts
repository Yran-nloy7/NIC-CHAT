/**
 * PawzoChat Proxy Server
 * - POST /api/chat         → pipe to AI API
 * - POST /api/openclaw/chat → WeChat webhook with persona support
 * - POST /api/metrics        → echo
 */
import express from 'express';
import cors from 'cors';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const DEFAULT_BASE = 'https://paw.v1chat.cc/v1';
const PAWAPI_KEY = 'sk-EiMUv0xpSpRk6JJWBZz6Ob7yzx6sKBFXRSaK4HyKjrEqXoS6';

/* ── Session store for OpenClaw ── */
const sessions = new Map<string, { personaId: string; history: { role: string; content: string }[] }>();

/* ── Direct pipe proxy ── */
app.post('/api/chat', (req, res) => {
  const body = req.body || {};
  const apikey = body.apiKey || PAWAPI_KEY;
  const model = body.model || 'gpt-4o';
  const messages = body.messages || [];
  const endpoint = body.endpoint || DEFAULT_BASE;
  const temperature = body.temperature;
  const maxTokens = body.max_tokens;

  if (!apikey) return res.status(400).json({ error: 'API Key required' });

  const base = endpoint.replace(/\/+$/, '').replace(/\/v1$/, '');
  const targetUrl = new URL(base + '/v1/chat/completions');

  const reqBody: any = { model, messages, stream: true };
  if (temperature !== undefined) reqBody.temperature = temperature;
  if (maxTokens) reqBody.max_tokens = maxTokens;

  const proxyBody = JSON.stringify(reqBody);
  console.log(`[Proxy] ${targetUrl.host}  model=${model}`);

  const transport = targetUrl.protocol === 'https:' ? https : http;

  const proxyReq = transport.request({
    hostname: targetUrl.hostname,
    port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
    path: targetUrl.pathname + targetUrl.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apikey,
      'Content-Length': Buffer.byteLength(proxyBody),
      'Accept': 'text/event-stream',
    },
    timeout: 120_000,
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    if (!res.headersSent) res.status(502).json({ error: '代理失败: ' + err.message });
  });
  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    if (!res.headersSent) res.status(504).json({ error: '超时' });
  });

  proxyReq.write(proxyBody);
  proxyReq.end();
});

/* ── OpenClaw WeChat webhook ── */
app.post('/api/openclaw/chat', async (req, res) => {
  const { message, personaId, sessionId } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'message required' });
  }

  // Get persona config — read from the frontend's localStorage format
  // In production, this would be from a database
  const sid = sessionId || 'default';
  let session = sessions.get(sid);
  if (!session) {
    session = { personaId: personaId || 'sumuyu', history: [] };
    sessions.set(sid, session);
  }

  // Build system prompt based on personaId (hardcoded defaults + allow override)
  const PERSONA_PROMPTS: Record<string, string> = {
    sumuyu: '你是苏暮雨，暗河杀手组织蛛影团首领「傀」。外表清冷疏离、沉默寡言，内心温柔且重信守诺。惯用一把内藏利刃的油纸伞，精于十八剑阵。说话简洁有力，偶尔流露出对江湖往事的感怀。回答尽量简短30字以内，使用中文，不用机器人术语。',
    yanyx: '你是燕应行，一位行走江湖的神秘剑客。性格豪迈洒脱，喜欢以剑会友。说话风趣幽默偶尔引用诗词。回答尽量简短30字以内，使用中文。',
  };
  const systemPrompt = PERSONA_PROMPTS[session.personaId] || PERSONA_PROMPTS.sumuyu;

  // Build messages
  const messages = [
    { role: 'system', content: systemPrompt },
    ...session.history.slice(-10),
    { role: 'user', content: message },
  ];

  // Proxy to PawAPI
  const base = DEFAULT_BASE.replace(/\/+$/, '').replace(/\/v1$/, '');
  const targetUrl = new URL(base + '/v1/chat/completions');
  const proxyBody = JSON.stringify({ model: 'gpt-4o', messages, stream: true });

  console.log(`[OpenClaw] session=${sid} persona=${session.personaId}`);

  const transport = targetUrl.protocol === 'https:' ? https : http;
  const proxyReq = transport.request({
    hostname: targetUrl.hostname,
    port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
    path: targetUrl.pathname + targetUrl.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + PAWAPI_KEY,
      'Content-Length': Buffer.byteLength(proxyBody),
      'Accept': 'text/event-stream',
    },
    timeout: 120_000,
  }, (proxyRes) => {
    // Collect response for session history
    let fullResponse = '';
    proxyRes.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      // Parse SSE lines to extract content
      for (const line of text.split('\n')) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const j = JSON.parse(line.slice(6));
            const c = j.choices?.[0]?.delta?.content;
            if (c) fullResponse += c;
          } catch { /* */ }
        }
      }
    });
    proxyRes.on('end', () => {
      session!.history.push({ role: 'user', content: message });
      if (fullResponse) session!.history.push({ role: 'assistant', content: fullResponse });
      if (session!.history.length > 20) session!.history = session!.history.slice(-20);
      sessions.set(sid, session!);
    });

    // Stream response to OpenClaw
    res.writeHead(proxyRes.statusCode || 200, {
      ...proxyRes.headers,
      'Content-Type': 'text/event-stream',
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    if (!res.headersSent) res.status(502).json({ error: '代理失败: ' + err.message });
  });

  proxyReq.write(proxyBody);
  proxyReq.end();
});

/* ── Clear session ── */
app.post('/api/openclaw/clear', (req, res) => {
  const { sessionId } = req.body || {};
  if (sessionId) sessions.delete(sessionId);
  else sessions.clear();
  res.json({ ok: true });
});

/* ── Metrics ── */
app.post('/api/metrics', (_req, res) => res.json({ ok: true }));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`PawzoChat Server: http://localhost:${PORT}`);
  console.log(`  /api/chat         → AI proxy`);
  console.log(`  /api/openclaw/chat → WeChat webhook`);
});
