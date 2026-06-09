/**
 * Ollama adapter — callback-based.
 */

import type { ChatAdapter, ChatRequest, SSEGatewayEvent, ModelInfo } from './types';

export const ollamaAdapter: ChatAdapter = {
  async stream(req: ChatRequest, onEvent: (evt: SSEGatewayEvent) => void): Promise<void> {
    const endpoint = req.endpoint || 'http://localhost:11434';
    const model = req.model || 'qwen3';

    const messages = [
      ...(req.systemPrompt ? [{ role: 'system' as const, content: req.systemPrompt }] : []),
      ...req.messages.map(m => ({ role: m.role, content: m.content })),
    ];

    let response: Response;
    try {
      response = await fetch(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: true }),
      });
    } catch {
      onEvent({ event: 'error', data: { message: `无法连接 Ollama (${endpoint})。请确认 ollama serve 已启动` } });
      return;
    }

    if (!response.ok) {
      let msg = `Ollama 错误 ${response.status}`;
      if (response.status === 404) msg = `模型 "${model}" 未安装。运行: ollama pull ${model}`;
      onEvent({ event: 'error', data: { message: msg } });
      return;
    }

    if (!response.body) { onEvent({ event: 'error', data: { message: '流不可用' } }); return; }

    onEvent({ event: 'state', data: { state: 'answering' } });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) onEvent({ event: 'text', data: { text: parsed.message.content } });
          } catch { /* */ }
        }
      }
    } finally { reader.releaseLock(); }

    onEvent({ event: 'state', data: { state: 'completed' } });
  },

  async listModels(_apiKey?: string, endpoint?: string): Promise<ModelInfo[]> {
    const base = endpoint || 'http://localhost:11434';
    try {
      const res = await fetch(`${base}/api/tags`);
      if (!res.ok) return [];
      const data = await res.json() as { models?: Array<{ name: string }> };
      return (data.models || []).map(m => ({ id: m.name, name: m.name }));
    } catch { return []; }
  },
};
