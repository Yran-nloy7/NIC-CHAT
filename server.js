/**
 * PawzoChat-style AI Chat Server
 * Single-file: serves HTML UI + proxies AI API calls
 * Run: node server.js
 * Open: http://localhost:3000
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = 3000;
const DEFAULT_KEY = 'sk-EiMUv0xpSpRk6JJWBZz6Ob7yzx6sKBFXRSaK4HyKjrEqXoS6';
const DEFAULT_BASE = 'https://paw.v1chat.cc/v1';

// ── HTML UI ──
const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Chat - Pawzo</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0d1117;color:#c9d1d9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;height:100vh;display:flex;flex-direction:column}
header{background:#161b22;border-bottom:1px solid #30363d;padding:12px 20px;display:flex;align-items:center;gap:12px;flex-shrink:0}
header h1{font-size:16px;background:linear-gradient(135deg,#58a6ff,#bc8cff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;flex:1}
header select,header input{background:#21262d;border:1px solid #30363d;color:#c9d1d9;padding:6px 10px;border-radius:6px;font-size:12px}
header input{width:220px}
#msgs{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px}
.msg{max-width:85%;animation:fadeIn .3s}
.msg.user{align-self:flex-end}
.msg.ai{align-self:flex-start}
.bubble{padding:12px 16px;border-radius:16px;font-size:14px;line-height:1.6;word-break:break-word}
.msg.user .bubble{background:#238636;color:#fff;border-bottom-right-radius:4px}
.msg.ai .bubble{background:#21262d;border:1px solid #30363d;border-bottom-left-radius:4px}
.msg.ai .bubble pre{background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:12px;overflow-x:auto;margin:8px 0}
.msg.ai .bubble code{font-size:13px}
.msg.ai .bubble p{margin:4px 0}
.msg.ai .bubble table{width:100%;border-collapse:collapse;margin:8px 0}
.msg.ai .bubble th,.msg.ai .bubble td{border:1px solid #30363d;padding:6px 10px;text-align:left}
.msg.ai .bubble blockquote{border-left:3px solid #58a6ff;padding-left:12px;color:#8b949e;margin:8px 0}
.thinking{font-size:11px;color:#8b949e;margin-bottom:8px;padding:6px 10px;background:#1c2128;border-radius:6px;border-left:2px solid #d29922}
.tool-call{font-size:11px;color:#58a6ff;margin-bottom:8px;padding:4px 8px;background:#1c2128;border-radius:4px;display:inline-block}
.status-bar{padding:6px 20px;font-size:11px;color:#8b949e;background:#161b22;border-top:1px solid #30363d;display:flex;align-items:center;gap:6px;flex-shrink:0}
.status-dot{width:6px;height:6px;border-radius:50%}
.status-dot.thinking{background:#d29922;animation:pulse 1s infinite}
.status-dot.answering{background:#3fb950;animation:pulse 1s infinite}
.status-dot.completed{background:#3fb950}
.status-dot.error{background:#f85149}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.cursor{display:inline-block;width:8px;height:16px;background:#58a6ff;margin-left:2px;vertical-align:text-bottom;animation:pulse .8s infinite}
footer{flex-shrink:0;padding:16px 20px;background:#161b22;border-top:1px solid #30363d}
footer textarea{width:100%;background:#21262d;border:1px solid #30363d;color:#c9d1d9;padding:10px 14px;border-radius:10px;font-size:14px;resize:none;font-family:inherit;outline:none;min-height:44px;max-height:120px}
footer textarea:focus{border-color:#58a6ff}
.settings{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.metrics-panel{margin-top:8px;font-size:11px;color:#8b949e;display:flex;gap:16px}
.metrics-panel span{color:#58a6ff}
</style>
</head>
<body>
<header>
  <h1>AI Chat</h1>
  <div class="settings">
    <select id="model" onchange="saveSettings()">
      <option value="gpt-4o">GPT-4o</option>
      <option value="deepseek-v4-pro">DeepSeek V4 Pro</option>
      <option value="deepseek-v3">DeepSeek V3</option>
      <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
      <option value="claude-opus-4-8">Claude Opus 4.8</option>
      <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
      <option value="gemini-3-pro">Gemini 3 Pro</option>
      <option value="doubao-seed-1-6-250615">豆包 Seed 1.6</option>
    </select>
    <input id="apikey" type="password" placeholder="API Key" onchange="saveSettings()">
    <select id="persona" onchange="saveSettings()">
      <option value="">无角色设定</option>
      <option value="苏暮雨">苏暮雨 (暗河杀手)</option>
      <option value="燕应行">燕应行 (神秘侠客)</option>
      <option value="assistant">通用助手</option>
    </select>
  </div>
</header>

<div id="msgs">
  <div style="text-align:center;color:#484f58;margin-top:20vh">
    <div style="font-size:40px;margin-bottom:12px">💬</div>
    <div>输入消息开始对话</div>
  </div>
</div>

<div class="status-bar" id="statusBar">
  <div class="status-dot completed" id="statusDot"></div>
  <span id="statusText">就绪</span>
  <span id="metricsText" style="margin-left:auto"></span>
</div>

<footer>
  <textarea id="input" rows="1" placeholder="输入消息... (Enter 发送, Shift+Enter 换行)" onkeydown="handleKey(event)"></textarea>
</footer>

<script>
// ── State ──
let isStreaming = false;
let currentAbort = null;

// ── Settings persistence ──
const S = {
  get model() { return localStorage.getItem('paw-model') || document.getElementById('model').value },
  set model(v) { localStorage.setItem('paw-model', v) },
  get apikey() { return localStorage.getItem('paw-key') || '' },
  set apikey(v) { localStorage.setItem('paw-key', v) },
  get persona() { return localStorage.getItem('paw-persona') || '' },
  set persona(v) { localStorage.setItem('paw-persona', v) },
};

function loadSettings() {
  if (S.model) document.getElementById('model').value = S.model;
  if (S.apikey) document.getElementById('apikey').value = S.apikey;
  else document.getElementById('apikey').value = '${DEFAULT_KEY}';
  if (S.persona) document.getElementById('persona').value = S.persona;
}
function saveSettings() {
  S.model = document.getElementById('model').value;
  S.apikey = document.getElementById('apikey').value;
  S.persona = document.getElementById('persona').value;
}

// ── Persona system prompts (from PawzoChat) ──
const PERSONAS = {
  '苏暮雨': '你是苏暮雨，暗河杀手组织成员，直属蛛影杀手团首领"傀"。你外表清冷疏离、沉默寡言，但内心温柔、重信守诺。你习惯于通过练剑来平复内心。回答时：用简洁的短句，语气清冷但不失温度，偶尔流露出对江湖和往事的感怀。不要说自己是AI或机器人。',
  '燕应行': '你是燕应行，一位行走江湖的神秘剑客。你性格豪迈洒脱，喜欢以剑会友。说话风趣幽默，偶尔引用诗词。对武林典故了如指掌。喜欢用比喻和故事来说明道理。不要说自己是AI或机器人。',
  'assistant': '你是一个有用的 AI 助手，用简洁清晰的中文回答。',
};

// ── Markdown render ──
function md2html(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    // Bold, italic
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    // Code blocks
    .replace(/\`\`\`(\w*)\n([\\s\\S]*?)\`\`\`/g,'<pre><code>$2</code></pre>')
    .replace(/\`(.+?)\`/g,'<code>$1</code>')
    // Headers
    .replace(/^### (.+)$/gm,'<h3>$1</h3>')
    .replace(/^## (.+)$/gm,'<h2>$1</h2>')
    .replace(/^# (.+)$/gm,'<h1>$1</h1>')
    // Tables
    .replace(/^\|(.+)\|$/gm, function(m){return m.includes('---')?'':m.replace(/^\|/,'<tr><td>').replace(/\|$/,'</td></tr>').replace(/\|/g,'</td><td>')})
    // Blockquote
    .replace(/^&gt; (.+)$/gm,'<blockquote>$1</blockquote>')
    // Lists
    .replace(/^- (.+)$/gm,'<li>$1</li>')
    // Newlines to <br> or <p>
    .replace(/\n\n/g,'</p><p>')
    .replace(/\n/g,'<br>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<p><\/p>/g,'');
  html = html.replace(/<tr>/g,'<table><tr>').replace(/<\/tr>(?![\s\S]*<tr>)/,'</tr></table>');
  return html;
}

// ── Chat UI ──
function addMsg(role, id) {
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  div.id = id || '';
  if (role === 'ai') {
    div.innerHTML = '<div class="bubble"></div>';
  } else {
    div.innerHTML = '<div class="bubble"></div>';
  }
  document.getElementById('msgs').appendChild(div);
  scrollDown();
  return div;
}

function scrollDown() {
  const msgs = document.getElementById('msgs');
  msgs.scrollTop = msgs.scrollHeight;
}

function setStatus(state) {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  dot.className = 'status-dot ' + state;
  const labels = {thinking:'思考中...',answering:'生成中...',completed:'就绪',error:'错误'};
  text.textContent = labels[state] || state;
}

// ── API call ──
async function sendMessage() {
  const input = document.getElementById('input');
  const text = input.value.trim();
  if (!text || isStreaming) return;
  input.value = '';
  input.style.height = 'auto';

  const apikey = document.getElementById('apikey').value || '${DEFAULT_KEY}';
  const model = document.getElementById('model').value;
  const persona = document.getElementById('persona').value;

  // User message
  const userDiv = addMsg('user', 'user-' + Date.now());
  userDiv.querySelector('.bubble').textContent = text;

  // AI message placeholder
  const aiId = 'ai-' + Date.now();
  const aiDiv = addMsg('ai', aiId);
  const bubble = aiDiv.querySelector('.bubble');

  // Build messages with persona
  const systemPrompt = PERSONAS[persona] || '';
  const messages = [];
  if (systemPrompt) messages.push({role:'system',content:systemPrompt});
  // Add recent history
  const allBubbles = document.querySelectorAll('.msg');
  let historyCount = 0;
  allBubbles.forEach(function(m) {
    if (historyCount >= 20) return;
    if (m.classList.contains('user')) {
      messages.push({role:'user',content:m.querySelector('.bubble').textContent});
      historyCount++;
    } else if (m.classList.contains('ai') && m.id && m.id !== aiId) {
      const b = m.querySelector('.bubble');
      const c = b.getAttribute('data-raw') || b.textContent;
      if (c && !c.startsWith('❌')) {
        messages.push({role:'assistant',content:c});
        historyCount++;
      }
    }
  });

  isStreaming = true;
  setStatus('thinking');

  const startTime = Date.now;
  let firstChunk = true;
  let ttfb = 0;
  let chunkCount = 0;
  let fullContent = '';
  let thinkingContent = '';

  try {
    const controller = new AbortController();
    currentAbort = controller;

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({messages,model,apikey}),
      signal: controller.signal,
    });

    if (!res.ok) {
      let err = 'API 错误 ' + res.status;
      if (res.status === 401) err = 'API Key 无效';
      else if (res.status === 404) err = '模型不存在';
      else if (res.status === 429) err = '请求频率超限';
      bubble.innerHTML = '❌ ' + err;
      setStatus('error');
      isStreaming = false;
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    setStatus('answering');

    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      chunkCount++;
      if (firstChunk) { ttfb = Date.now() - startTime; firstChunk = false; }

      buf += decoder.decode(value, {stream: true});
      const lines = buf.split('\n');
      buf = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === '[DONE]') continue;

        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.reasoning_content) {
            thinkingContent += delta.reasoning_content;
          }
          if (delta?.content) {
            fullContent += delta.content;
            // Update bubble with markdown
            if (thinkingContent) {
              bubble.innerHTML = '<div class="thinking">' + thinkingContent.replace(/</g,'&lt;') + '</div>' + md2html(fullContent) + '<span class="cursor"></span>';
            } else {
              bubble.innerHTML = md2html(fullContent) + '<span class="cursor"></span>';
            }
            scrollDown();
          }
        } catch(e) {}
      }
    }

    // Remove cursor
    bubble.innerHTML = thinkingContent
      ? '<div class="thinking">' + thinkingContent.replace(/</g,'&lt;') + '</div>' + md2html(fullContent)
      : md2html(fullContent);
    bubble.setAttribute('data-raw', fullContent);

    setStatus('completed');
    const ttlb = Date.now() - startTime;
    document.getElementById('metricsText').textContent =
      'TTFB: ' + ttfb + 'ms | TTLB: ' + ttlb + 'ms | Chunks: ' + chunkCount + ' | Chars: ' + fullContent.length;

  } catch(e) {
    if (e.name !== 'AbortError') {
      bubble.innerHTML = '❌ ' + (e.message || '网络错误');
      setStatus('error');
    }
  }

  isStreaming = false;
  currentAbort = null;
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// Init
loadSettings();
document.getElementById('input').focus();
</script>
</body>
</html>`;

// ── Server ──
const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const url = req.url;

  // Serve HTML UI
  if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(HTML);
  }

  // Proxy AI API calls
  if (req.method === 'POST' && url === '/api/chat') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch(e) { parsed = {}; }

      const apikey = parsed.apikey || DEFAULT_KEY;
      const model = parsed.model || 'gpt-4o';
      const messages = parsed.messages || [];
      const base = DEFAULT_BASE.replace(/\/+$/,'');

      const proxyBody = JSON.stringify({ model, messages, stream: true });
      const targetUrl = new URL(base + '/chat/completions');

      console.log('[Proxy] ' + targetUrl.href + ' model=' + model);

      const proxyReq = https.request({
        hostname: targetUrl.hostname,
        port: 443,
        path: targetUrl.pathname + targetUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apikey,
          'Content-Length': Buffer.byteLength(proxyBody),
          'Accept': 'text/event-stream',
        },
      }, proxyRes => {
        // Pipe headers back
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        // Pipe body
        proxyRes.pipe(res);
      });

      proxyReq.on('error', err => {
        console.error('[Proxy] Error:', err.message);
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '代理请求失败: ' + err.message }));
        }
      });

      proxyReq.write(proxyBody);
      proxyReq.end();
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════╗');
  console.log('  ║   AI Chat Server (Pawzo)    ║');
  console.log('  ║   http://localhost:' + PORT + '       ║');
  console.log('  ╚══════════════════════════════╝');
  console.log('');
  console.log('  端点:  paw.v1chat.cc/v1');
  console.log('  模型:  GPT-4o / DeepSeek / Claude / Gemini');
  console.log('');
});
