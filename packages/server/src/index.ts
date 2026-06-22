/**
 * NIC-CHAT Proxy Server
 * POST /api/chat              → pipe to AI API
 * POST /api/openclaw/chat     → WeChat webhook
 * POST /api/openclaw/clear    → clear session
 * GET  /api/scenarios         → [5] list scenario presets
 * POST /api/memories/summarize → [3] AI-summarize conversation into memory
 * POST /api/moments/generate   → [6] AI-generate a moment post
 * POST /api/metrics            → echo
 */
import express from 'express';
import cors from 'cors';
import https from 'https';
import http from 'http';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const DEFAULT_BASE = 'https://paw.v1chat.cc/v1';
const DEFAULT_KEY = process.env.PAWAPI_KEY || '';

function proxyToAI(req: express.Request, res: express.Response, body: any, apikey: string, endpoint: string) {
  const model = body.model || 'gpt-4o';
  const messages = body.messages || [];
  const base = (endpoint || DEFAULT_BASE).replace(/\/+$/, '').replace(/\/v1$/, '');
  const targetUrl = new URL(base + '/v1/chat/completions');

  const reqBody: any = { model, messages, stream: body.stream !== false };
  if (body.temperature !== undefined) reqBody.temperature = body.temperature;
  if (body.max_tokens) reqBody.max_tokens = body.max_tokens;
  const proxyBody = JSON.stringify(reqBody);

  console.log(`[Proxy] → ${targetUrl.host}  model=${model}`);

  const transport = targetUrl.protocol === 'https:' ? https : http;
  const proxyReq = transport.request({
    hostname: targetUrl.hostname, port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
    path: targetUrl.pathname + targetUrl.search, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (apikey || DEFAULT_KEY), 'Content-Length': Buffer.byteLength(proxyBody), 'Accept': 'text/event-stream' },
    timeout: 120_000,
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (err: any) => { if (!res.headersSent) res.status(502).json({ error: '代理失败: ' + err.message }); });
  proxyReq.on('timeout', () => { proxyReq.destroy(); if (!res.headersSent) res.status(504).json({ error: '超时' }); });
  proxyReq.write(proxyBody);
  proxyReq.end();
}

/* ── /api/chat ── */
app.post('/api/chat', (req, res) => {
  const body = req.body || {};
  if (!body.apiKey && !DEFAULT_KEY) return res.status(400).json({ error: 'API Key required' });
  proxyToAI(req, res, body, body.apiKey || DEFAULT_KEY, body.endpoint || DEFAULT_BASE);
});

/* ── [5] Scenario presets ── */
const SCENARIOS = [
  { id: 'interview', name: '模拟面试', icon: '💼', description: 'AI 扮演面试官', category: 'interview' },
  { id: 'brainstorm', name: '创意发散', icon: '💡', description: '头脑风暴', category: 'creative' },
  { id: 'therapy', name: '心理疏导', icon: '🧘', description: '温和倾听引导', category: 'therapy' },
  { id: 'debate', name: '辩论对抗', icon: '⚔️', description: 'AI 持相反观点', category: 'debate' },
  { id: 'storyteller', name: '故事接龙', icon: '📖', description: '轮流编故事', category: 'roleplay' },
  { id: 'teacher', name: '知识导师', icon: '📚', description: '苏格拉底式教学', category: 'interview' },
  { id: 'writer', name: '写作助手', icon: '✍️', description: '润色改写', category: 'creative' },
  { id: 'companion', name: '深夜树洞', icon: '🌙', description: '温暖陪伴', category: 'therapy' },
];
app.get('/api/scenarios', (_req, res) => res.json({ scenarios: SCENARIOS }));

/* ── [3] Memory summarization ── */
app.post('/api/memories/summarize', (req, res) => {
  const { messages, apiKey, endpoint } = req.body || {};
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'messages required' });

  const summaryPrompt = [
    { role: 'system', content: '从以下对话中提取关键信息，总结为一条简洁的记忆。用中文，不超过100字。格式：{ "summary": "...", "topics": ["..."] }' },
    { role: 'user', content: messages.map((m: any) => `${m.role}: ${m.content}`).join('\n').slice(-2000) },
  ];

  proxyToAI(req, res, { ...req.body, messages: summaryPrompt, stream: false, max_tokens: 200 }, apiKey || DEFAULT_KEY, endpoint || DEFAULT_BASE);
});

/* ── [6] AI-generated moment ── */
app.post('/api/moments/generate', (req, res) => {
  const { personaName, personaSystemPrompt, recentMessages, apiKey, endpoint } = req.body || {};
  if (!personaName) return res.status(400).json({ error: 'personaName required' });

  const momentPrompt = [
    { role: 'system', content: `你是${personaName}。${personaSystemPrompt ? '背景：' + personaSystemPrompt.slice(0, 200) : ''} 基于最近的对话，发一条朋友圈。像真人一样，自然、有个性。用中文，不超过50字。返回JSON：{ "content": "...", "mood": "😊|😢|😠|😨|😍|😂|🤔" }` },
    { role: 'user', content: `最近对话：\n${(recentMessages || []).map((m: any) => `${m.role}: ${m.content}`).join('\n').slice(-1000)}\n\n请发一条朋友圈。` },
  ];

  proxyToAI(req, res, { ...req.body, messages: momentPrompt, stream: false, max_tokens: 150 }, apiKey || DEFAULT_KEY, endpoint || DEFAULT_BASE);
});

/* ── OpenClaw ── */
const sessions = new Map<string, { personaId: string; history: { role: string; content: string }[] }>();

app.post('/api/openclaw/chat', (req, res) => {
  const { message, personaId, sessionId } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });
  const sid = sessionId || 'default';
  let s = sessions.get(sid);
  if (!s) { s = { personaId: personaId || 'default', history: [] }; sessions.set(sid, s); }
  const PERSONAS: Record<string, string> = {
    sumuyu: '你是苏暮雨，暗河杀手。清冷疏离，说话简短。',
    yanyx: '你是燕应行，豪迈剑客。风趣幽默。',
  };
  const sysPrompt = PERSONAS[s.personaId] || PERSONAS.sumuyu;
  const messages = [{ role: 'system', content: sysPrompt }, ...s.history.slice(-10), { role: 'user', content: message }];
  proxyToAI(req, res, { ...req.body, messages, model: req.body.model || 'gpt-4o', stream: true }, req.body.apiKey || DEFAULT_KEY, req.body.endpoint || DEFAULT_BASE);

  // Collect response for session
  let fullResponse = '';
  const origWrite = res.write.bind(res);
  res.write = function (chunk: any) {
    const text = chunk?.toString() || '';
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try { const c = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content; if (c) fullResponse += c; } catch {}
      }
    }
    return origWrite(chunk);
  } as any;
  res.on('finish', () => { if (fullResponse) { s!.history.push({ role: 'user', content: message }, { role: 'assistant', content: fullResponse }); if (s!.history.length > 20) s!.history = s!.history.slice(-20); } });
});

app.post('/api/openclaw/clear', (req, res) => { const { sessionId } = req.body || {}; if (sessionId) sessions.delete(sessionId); else sessions.clear(); res.json({ ok: true }); });
app.post('/api/metrics', (_req, res) => res.json({ ok: true }));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`NIC-CHAT Server: http://localhost:${PORT}`);
  console.log(`  /api/chat | /api/scenarios | /api/memories/summarize | /api/moments/generate | /api/openclaw/chat`);
});
