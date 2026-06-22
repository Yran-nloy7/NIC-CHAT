/**
 * Cloudflare Pages Function — NIC-CHAT API proxy
 * Same as Vercel version: supports /api/chat | /api/scenarios | /api/memories/summarize | /api/moments/generate
 */

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

async function streamResponse(upstream) {
  if (!upstream.ok) return new Response(await upstream.text(), { status: upstream.status });
  return new Response(upstream.body, { status: 200, headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
}

async function proxyChat(body) {
  const apikey = body.apiKey || '';
  const model = body.model || 'gpt-4o';
  const messages = body.messages || [];
  const endpoint = body.endpoint || 'https://paw.v1chat.cc/v1';
  const base = endpoint.replace(/\/+$/, '').replace(/\/v1$/, '');
  const reqBody = { model, messages, stream: body.stream !== false };
  if (body.temperature !== undefined) reqBody.temperature = body.temperature;
  if (body.max_tokens) reqBody.max_tokens = body.max_tokens;

  const upstream = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apikey}` },
    body: JSON.stringify(reqBody),
  });
  return streamResponse(upstream);
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');

  // [5] Scenario presets
  if (request.method === 'GET' && path === '/scenarios') {
    return new Response(JSON.stringify({ scenarios: SCENARIOS }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  let body;
  try { body = await request.json(); } catch { body = {}; }

  if (path === '/chat') return proxyChat(body);

  // [3] Memory summarization
  if (path === '/memories/summarize') {
    const msgs = body.messages || [];
    const summaryPrompt = [
      { role: 'system', content: '从对话中提取关键信息，总结为一条简洁的记忆。用中文，不超过100字。返回JSON：{ "summary": "...", "topics": ["..."] }' },
      { role: 'user', content: msgs.map(m => `${m.role}: ${m.content}`).join('\n').slice(-2000) },
    ];
    return proxyChat({ ...body, messages: summaryPrompt, stream: false, max_tokens: 200 });
  }

  // [6] AI-generated moment
  if (path === '/moments/generate') {
    const { personaName, personaSystemPrompt, recentMessages } = body;
    const prompt = [
      { role: 'system', content: `你是${personaName || 'AI'}。${personaSystemPrompt ? '背景：' + personaSystemPrompt.slice(0, 200) : ''} 基于最近对话，发一条朋友圈。自然有个性。用中文，不超过50字。返回JSON：{ "content": "...", "mood": "😊|😢|😠|😨|😍|😂|🤔" }` },
      { role: 'user', content: `最近对话：\n${(recentMessages || []).map(m => `${m.role}: ${m.content}`).join('\n').slice(-1000)}\n\n发一条朋友圈。` },
    ];
    return proxyChat({ ...body, messages: prompt, stream: false, max_tokens: 150 });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}
