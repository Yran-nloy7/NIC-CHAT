import { create } from 'zustand';
import { useDataStore } from './data';

export interface Message {
  id: string; role: 'user' | 'assistant';
  content: string; thinking: string;
  state: 'thinking' | 'answering' | 'completed' | 'error';
  createdAt: number;
}

let _n = 0; function genId() { return 'm' + (++_n).toString(36); }

export function renderMd(text: string): string {
  if (!text) return '';
  return ('<p>' + text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/```\w*\n([\s\S]*?)```/g,'<pre><code>$1</code></pre>').replace(/`(.+?)`/g,'<code>$1</code>')
    .replace(/^### (.+)$/gm,'<h3>$1</h3>').replace(/^## (.+)$/gm,'<h2>$1</h2>').replace(/^# (.+)$/gm,'<h1>$1</h1>')
    .replace(/^> (.+)$/gm,'<blockquote>$1</blockquote>').replace(/^- (.+)$/gm,'<li>$1</li>')
    .replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>') + '</p>')
    .replace(/<p><\/p>/g,'');
}

interface ChatStore {
  messages: Message[]; isStreaming: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [], isStreaming: false,

  sendMessage: async (text: string) => {
    const data = useDataStore.getState();
    const persona = data.personas.find(p => p.id === data.selectedPersonaId);
    if (!persona) { set(s => ({ messages: [...s.messages, mkErr('请先在左侧选择或创建一个角色')] })); return; }
    const provider = data.providers.find(p => p.id === persona.providerId);
    if (!provider) { set(s => ({ messages: [...s.messages, mkErr('角色未绑定供应商，请编辑角色设置')] })); return; }
    if (!provider.apiKey) { set(s => ({ messages: [...s.messages, mkErr('供应商未设置 API Key')] })); return; }

    const u = mkMsg('user', text, 'completed');
    const a = mkMsg('assistant', '', 'thinking');
    set(s => ({ messages: [...s.messages, u, a], isStreaming: true }));

    const history = get().messages.filter(m => m.state === 'completed' || m.role === 'user').slice(-20).map(m => ({ role: m.role, content: m.content }));

    const base = (provider.endpoint || '').replace(/\/+$/,'').replace(/\/v1$/,'');
    const apiUrl = `${base}/v1/chat/completions`;

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
        body: JSON.stringify({ model: persona.model, messages: [{ role: 'system', content: persona.systemPrompt }, ...history], stream: true, temperature: persona.temperature, max_tokens: persona.maxTokens }),
      });
      if (!res.ok) {
        let msg = `API 错误 ${res.status}`;
        if (res.status === 401) msg = 'API Key 无效'; else if (res.status === 404) msg = '模型不存在';
        set(s => ({ messages: s.messages.map(m => m.id === a.id ? { ...m, content: '❌ ' + msg, state: 'error' } : m), isStreaming: false }));
        return;
      }
      if (!res.body) throw new Error('No body');

      set(s => ({ messages: s.messages.map(m => m.id === a.id ? { ...m, state: 'answering' } : m) }));

      const reader = res.body.getReader(); const dec = new TextDecoder();
      let fc = '', ft = '', buf = '';
      try {
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n'); buf = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const p = line.slice(6).trim(); if (!p || p === '[DONE]') continue;
            try {
              const j = JSON.parse(p); const d = j.choices?.[0]?.delta;
              if (d?.reasoning_content) { ft += d.reasoning_content; set(s => ({ messages: s.messages.map(m => m.id === a.id ? { ...m, thinking: ft } : m) })); }
              if (d?.content) { fc += d.content; set(s => ({ messages: s.messages.map(m => m.id === a.id ? { ...m, content: fc } : m) })); }
            } catch {}
          }
        }
      } finally { reader.releaseLock(); }

      set(s => ({ messages: s.messages.map(m => m.id === a.id ? { ...m, state: 'completed' } : m), isStreaming: false }));
    } catch (err) {
      set(s => ({ messages: s.messages.map(m => m.id === a.id ? { ...m, content: '❌ ' + (err instanceof Error ? err.message : '网络错误'), state: 'error' } : m), isStreaming: false }));
    }
  },
  clearMessages: () => set({ messages: [], isStreaming: false }),
}));

function mkMsg(role: 'user'|'assistant', content: string, state: Message['state']): Message {
  return { id: genId(), role, content, thinking: '', state, createdAt: Date.now() };
}
function mkErr(msg: string): Message { return mkMsg('assistant', '❌ ' + msg, 'error'); }
