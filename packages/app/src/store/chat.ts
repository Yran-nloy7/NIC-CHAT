import { create } from 'zustand';
import { useDataStore } from './data';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking: string;
  state: 'thinking' | 'answering' | 'completed' | 'error';
  createdAt: number;
}

let _n = 0;
function genId() { return 'm' + (++_n).toString(36); }

function md2html(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

export function renderContent(content: string): string {
  return '<p>' + md2html(content) + '</p>';
}

interface ChatStore {
  messages: Message[];
  isStreaming: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isStreaming: false,

  sendMessage: async (text: string) => {
    const data = useDataStore.getState();
    const persona = data.personas.find(p => p.id === data.selectedPersonaId);

    if (!persona) {
      const err: Message = { id: genId(), role: 'assistant', content: '❌ 请先在设置中添加并选择一个 AI 角色', thinking: '', state: 'error', createdAt: Date.now() };
      set(s => ({ messages: [...s.messages, err] }));
      return;
    }

    const provider = data.providers.find(p => p.id === persona.providerId);
    if (!provider) {
      const err: Message = { id: genId(), role: 'assistant', content: '❌ 角色绑定的 API 供应商不存在，请检查设置', thinking: '', state: 'error', createdAt: Date.now() };
      set(s => ({ messages: [...s.messages, err] }));
      return;
    }

    if (!provider.apiKey) {
      const err: Message = { id: genId(), role: 'assistant', content: '❌ API Key 未设置，请在设置中配置供应商', thinking: '', state: 'error', createdAt: Date.now() };
      set(s => ({ messages: [...s.messages, err] }));
      return;
    }

    const userMsg: Message = { id: genId(), role: 'user', content: text, thinking: '', state: 'completed', createdAt: Date.now() };
    const aiMsg: Message = { id: genId(), role: 'assistant', content: '', thinking: '', state: 'thinking', createdAt: Date.now() };
    set(s => ({ messages: [...s.messages, userMsg, aiMsg], isStreaming: true }));

    // Build conversation history
    const history = get().messages
      .filter(m => m.state === 'completed' && m.role !== 'assistant' || m.role === 'user')
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: persona.systemPrompt },
            ...history,
          ],
          apiKey: provider.apiKey,
          model: persona.model,
          endpoint: provider.endpoint,
          temperature: persona.temperature,
          max_tokens: persona.maxTokens,
        }),
      });

      if (!response.ok) {
        let msg = `API 错误 ${response.status}`;
        if (response.status === 401) msg = 'API Key 无效';
        else if (response.status === 404) msg = '模型不存在或 Endpoint 错误';
        else if (response.status === 429) msg = '请求频率超限';
        set(s => ({
          messages: s.messages.map(m => m.id === aiMsg.id ? { ...m, content: '❌ ' + msg, state: 'error' } : m),
          isStreaming: false,
        }));
        return;
      }

      if (!response.body) throw new Error('No body');

      set(s => ({
        messages: s.messages.map(m => m.id === aiMsg.id ? { ...m, state: 'answering' } : m),
      }));

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let fullThinking = '';
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === '[DONE]') continue;

            try {
              const parsed = JSON.parse(payload);
              const delta = parsed.choices?.[0]?.delta;
              if (delta?.reasoning_content) {
                fullThinking += delta.reasoning_content;
                set(s => ({
                  messages: s.messages.map(m => m.id === aiMsg.id ? { ...m, thinking: fullThinking } : m),
                }));
              }
              if (delta?.content) {
                fullContent += delta.content;
                set(s => ({
                  messages: s.messages.map(m => m.id === aiMsg.id ? { ...m, content: fullContent } : m),
                }));
              }
            } catch { /* */ }
          }
        }
      } finally {
        reader.releaseLock();
      }

      set(s => ({
        messages: s.messages.map(m => m.id === aiMsg.id ? { ...m, state: 'completed' } : m),
        isStreaming: false,
      }));

    } catch (err) {
      const msg = err instanceof Error ? err.message : '网络错误';
      set(s => ({
        messages: s.messages.map(m => m.id === aiMsg.id ? { ...m, content: '❌ ' + msg, state: 'error' } : m),
        isStreaming: false,
      }));
    }
  },

  clearMessages: () => set({ messages: [], isStreaming: false }),
}));
