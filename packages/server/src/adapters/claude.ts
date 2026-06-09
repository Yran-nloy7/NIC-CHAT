/**
 * Anthropic Claude adapter — callback-based.
 */

import type { ChatAdapter, ChatRequest, SSEGatewayEvent, ModelInfo } from './types';

const CLAUDE_MODELS: ModelInfo[] = [
  { id: 'claude-opus-4-8', name: 'Claude Opus 4.8' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
];

export const claudeAdapter: ChatAdapter = {
  async stream(req: ChatRequest, onEvent: (evt: SSEGatewayEvent) => void): Promise<void> {
    const endpoint = req.endpoint || 'https://api.anthropic.com';
    const model = req.model || 'claude-sonnet-4-6';
    const apiKey = req.apiKey;

    if (!apiKey) {
      onEvent({ event: 'error', data: { message: 'Anthropic API Key 未设置' } });
      return;
    }

    const systemMessages = req.systemPrompt ? [req.systemPrompt] : [];
    const messages = req.messages.map(m => ({ role: m.role, content: m.content }));

    let response: Response;
    try {
      response = await fetch(`${endpoint}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model, system: systemMessages.length > 0 ? systemMessages : undefined, messages, max_tokens: 8192, stream: true }),
      });
    } catch {
      onEvent({ event: 'error', data: { message: '无法连接到 Anthropic API' } });
      return;
    }

    if (!response.ok) {
      let msg = `Claude 错误 ${response.status}`;
      if (response.status === 401) msg = 'API Key 无效';
      else if (response.status === 529) msg = 'Claude 服务繁忙';
      onEvent({ event: 'error', data: { message: msg } });
      return;
    }

    if (!response.body) { onEvent({ event: 'error', data: { message: '流不可用' } }); return; }

    onEvent({ event: 'state', data: { state: 'thinking' } });

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
          try {
            const event = JSON.parse(line.slice(6));
            switch (event.type) {
              case 'content_block_start':
                if (event.content_block?.type === 'text') onEvent({ event: 'state', data: { state: 'answering' } });
                else if (event.content_block?.type === 'tool_use') onEvent({ event: 'tool_call', data: { name: event.content_block.name, args: event.content_block.input } });
                break;
              case 'content_block_delta':
                if (event.delta?.type === 'thinking_delta' && event.delta.thinking) onEvent({ event: 'thinking', data: { text: event.delta.thinking } });
                else if (event.delta?.type === 'text_delta' && event.delta.text) onEvent({ event: 'text', data: { text: event.delta.text } });
                break;
              case 'error':
                onEvent({ event: 'error', data: { message: event.error?.message || 'Claude 流错误' } });
                return;
            }
          } catch { /* */ }
        }
      }
    } finally { reader.releaseLock(); }

    onEvent({ event: 'state', data: { state: 'completed' } });
  },

  async listModels(): Promise<ModelInfo[]> { return CLAUDE_MODELS; },
};
