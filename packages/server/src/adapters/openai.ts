/**
 * OpenAI-compatible adapter — callback-based (no async generators).
 */

import type { ChatAdapter, ChatRequest, SSEGatewayEvent, ModelInfo } from './types';

function normalizeBase(endpoint: string): string {
  return endpoint.replace(/\/+$/, '').replace(/\/v1$/, '');
}

export const openaiAdapter: ChatAdapter = {
  async stream(req: ChatRequest, onEvent: (evt: SSEGatewayEvent) => void): Promise<void> {
    const rawEndpoint = req.endpoint || 'https://api.openai.com';
    const base = normalizeBase(rawEndpoint);
    const model = req.model || 'gpt-4o';
    const apiKey = req.apiKey;

    if (!apiKey) {
      onEvent({ event: 'error', data: { message: 'API Key 未设置，请点击右上角 ⚙️ 设置' } });
      return;
    }

    const messages = [
      ...(req.systemPrompt ? [{ role: 'system' as const, content: req.systemPrompt }] : []),
      ...req.messages.map(m => ({ role: m.role, content: m.content })),
    ];

    const url = `${base}/v1/chat/completions`;
    console.log(`[OpenAI] → ${url}  model=${model}`);

    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 120_000);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages, stream: true }),
        signal: abort.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      const msg = err instanceof Error && err.name === 'AbortError'
        ? 'API 请求超时'
        : `无法连接到 ${rawEndpoint}，请检查网络或 Endpoint`;
      onEvent({ event: 'error', data: { message: msg } });
      return;
    }
    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      let msg = `API 错误 ${response.status}`;
      if (response.status === 401) msg = 'API Key 无效';
      else if (response.status === 404) msg = `模型 "${model}" 不存在`;
      else if (response.status === 429) msg = '请求频率超限，请稍后重试';
      else {
        try { msg = JSON.parse(errBody).error?.message || msg; } catch { /* */ }
      }
      onEvent({ event: 'error', data: { message: msg } });
      return;
    }

    if (!response.body) {
      onEvent({ event: 'error', data: { message: '响应流不可用' } });
      return;
    }

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
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.content) {
              onEvent({ event: 'text', data: { text: delta.content } });
            }
            if (delta?.reasoning_content) {
              onEvent({ event: 'thinking', data: { text: delta.reasoning_content } });
            }
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.function) {
                  onEvent({ event: 'tool_call', data: { name: tc.function.name, arguments: tc.function.arguments } });
                }
              }
            }
          } catch { /* skip */ }
        }
      }
    } finally {
      reader.releaseLock();
    }

    onEvent({ event: 'state', data: { state: 'completed' } });
  },

  async listModels(apiKey?: string, endpoint?: string): Promise<ModelInfo[]> {
    if (!apiKey) return [];
    const base = normalizeBase(endpoint || 'https://api.openai.com');
    try {
      const res = await fetch(`${base}/v1/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) return [];
      const data = await res.json() as { data?: ModelInfo[] };
      return (data.data || []).slice(0, 30);
    } catch { return []; }
  },
};
