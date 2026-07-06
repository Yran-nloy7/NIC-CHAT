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

let seed = 0;
function genId() {
  seed += 1;
  return `m${seed.toString(36)}${Date.now().toString(36)}`;
}

export function renderMd(text: string): string {
  if (!text) return '';
  return (`<p>${text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/```\w*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')}</p>`).replace(/<p><\/p>/g, '');
}

interface ChatStore {
  messages: Message[];
  isStreaming: boolean;
  abortController: AbortController | null;
  sendMessage: (text: string, systemPromptAddon?: string) => Promise<void>;
  stopStreaming: () => void;
  retryLast: () => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isStreaming: false,
  abortController: null,

  sendMessage: async (text, systemPromptAddon) => {
    const data = useDataStore.getState();
    const persona = data.personas.find((p) => p.id === data.selectedPersonaId);
    if (!persona) {
      set((s) => ({ messages: [...s.messages, mkErr('请先选择或创建一个角色 Agent。')] }));
      return;
    }

    const provider = data.providers.find((p) => p.id === persona.providerId);
    if (!provider) {
      set((s) => ({ messages: [...s.messages, mkErr('当前角色还没有绑定 API 网关。')] }));
      return;
    }

    if (provider.authMode !== 'none' && !provider.apiKey) {
      set((s) => ({ messages: [...s.messages, mkErr('请先在个人设置中配置 API Key。')] }));
      return;
    }

    const userMessage = mkMsg('user', text, 'completed');
    const assistantMessage = mkMsg('assistant', '', 'thinking');
    const controller = new AbortController();
    set((s) => ({
      messages: [...s.messages, userMessage, assistantMessage],
      isStreaming: true,
      abortController: controller,
    }));

    const history = get().messages
      .filter((m) => m.state === 'completed')
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    const memories = data.memories
      .filter((m) => m.personaId === persona.id)
      .slice(0, persona.maxMemories)
      .map((m) => `- ${m.summary || m.content}`)
      .join('\n');

    const memoryPrompt = persona.memoryEnabled && persona.memoryInPrompt && memories
      ? `\n\n以下是这个角色与用户的长期记忆：\n${memories}`
      : '';

    const systemContent = [
      systemPromptAddon,
      persona.systemPrompt,
      memoryPrompt,
    ].filter(Boolean).join('\n\n');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider.preset,
          endpoint: provider.endpoint,
          apiKey: provider.apiKey,
          authMode: provider.authMode,
          model: persona.model,
          systemPrompt: systemContent,
          messages: [...history, { role: 'user', content: text }],
          temperature: persona.temperature,
          maxTokens: persona.maxTokens,
          timeout: provider.timeout,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`API 请求失败：${res.status}`);
      }
      if (!res.body) {
        throw new Error('当前浏览器不支持流式响应。');
      }

      set((s) => ({ messages: s.messages.map((m) => m.id === assistantMessage.id ? { ...m, state: 'answering' } : m) }));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let content = '';
      let thinking = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() || '';

          for (const chunk of chunks) {
            const event = parseSSE(chunk);
            if (!event) continue;
            if (event.event === 'text') content += event.data.text || '';
            if (event.event === 'thinking') thinking += event.data.text || '';
            if (event.event === 'error') throw new Error(event.data.message || '模型返回错误');
            if (event.event === 'state' && event.data.state === 'answering') {
              set((s) => ({ messages: s.messages.map((m) => m.id === assistantMessage.id ? { ...m, state: 'answering' } : m) }));
            }
            set((s) => ({
              messages: s.messages.map((m) => m.id === assistantMessage.id ? { ...m, content, thinking } : m),
            }));
          }
        }
      } finally {
        reader.releaseLock();
      }

      set((s) => ({
        messages: s.messages.map((m) => m.id === assistantMessage.id ? { ...m, state: 'completed' } : m),
        isStreaming: false,
        abortController: null,
      }));
    } catch (err) {
      const message = err instanceof Error && err.name === 'AbortError'
        ? '已停止生成。'
        : err instanceof Error ? err.message : '网络请求失败。';
      set((s) => ({
        messages: s.messages.map((m) => m.id === assistantMessage.id ? { ...m, content: message, state: 'error' } : m),
        isStreaming: false,
        abortController: null,
      }));
    }
  },

  stopStreaming: () => {
    get().abortController?.abort();
  },

  retryLast: async () => {
    const lastUser = [...get().messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    set((s) => ({ messages: s.messages.filter((m) => m.createdAt < lastUser.createdAt) }));
    await get().sendMessage(lastUser.content);
  },

  clearMessages: () => set({ messages: [], isStreaming: false, abortController: null }),
}));

function parseSSE(chunk: string): { event: string; data: any } | null {
  const eventLine = chunk.split('\n').find((line) => line.startsWith('event: '));
  const dataLine = chunk.split('\n').find((line) => line.startsWith('data: '));
  if (!eventLine || !dataLine) return null;
  try {
    return {
      event: eventLine.slice(7).trim(),
      data: JSON.parse(dataLine.slice(6)),
    };
  } catch {
    return null;
  }
}

function mkMsg(role: 'user' | 'assistant', content: string, state: Message['state']): Message {
  return { id: genId(), role, content, thinking: '', state, createdAt: Date.now() };
}

function mkErr(msg: string): Message {
  return mkMsg('assistant', msg, 'error');
}
