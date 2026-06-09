/**
 * OpenClaw Agent webhook endpoint — raw HTTP version
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { ProviderType, ChatMessage } from './adapters/types';
import { openaiAdapter } from './adapters/openai';
import { claudeAdapter } from './adapters/claude';
import { ollamaAdapter } from './adapters/ollama';
import type { ChatAdapter } from './adapters/types';

interface OpenClawRequest {
  message: string;
  sessionId?: string;
  userId?: string;
  provider?: ProviderType;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  systemPrompt?: string;
}

const adapters: Record<ProviderType, ChatAdapter> = {
  openai: openaiAdapter,
  claude: claudeAdapter,
  ollama: ollamaAdapter,
};

const sessions = new Map<string, ChatMessage[]>();
const MAX_SESSION_MESSAGES = 50;

export async function handleOpenClawChat(
  _req: IncomingMessage,
  res: ServerResponse,
  body: OpenClawRequest,
): Promise<void> {
  if (!body.message) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'message is required' }));
    return;
  }

  const sessionId = body.sessionId || 'default';
  const provider = body.provider || 'openai';
  const adapter = adapters[provider] ?? adapters.openai;

  let history = sessions.get(sessionId) || [];
  history.push({ role: 'user', content: body.message });
  if (history.length > MAX_SESSION_MESSAGES) history = history.slice(-MAX_SESSION_MESSAGES);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  if (res.socket) res.socket.setNoDelay(true);

  let aborted = false;
  _req.on('close', () => { aborted = true; });

  const send = (event: string, data: unknown) => {
    if (aborted) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  let fullResponse = '';

  await adapter.stream(
    {
      messages: history,
      model: body.model,
      apiKey: body.apiKey,
      endpoint: body.endpoint,
      systemPrompt: body.systemPrompt,
    },
    (evt) => {
      if (aborted) return;
      if (evt.event === 'error') { send('error', evt.data); return; }
      if (evt.event === 'state') {
        if ((evt.data as { state: string }).state === 'completed') return;
        return;
      }
      if (evt.event === 'text' || evt.event === 'thinking') {
        const text = (evt.data as { text: string }).text || '';
        fullResponse += text;
        send('delta', { content: text });
      }
    },
  );

  if (fullResponse) {
    history.push({ role: 'assistant', content: fullResponse });
    sessions.set(sessionId, history);
  }

  if (!aborted) {
    send('done', { sessionId });
    res.end();
  }
}

export function handleClearSession(
  body: { sessionId?: string },
  res: ServerResponse,
): void {
  if (body.sessionId) {
    sessions.delete(body.sessionId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } else {
    sessions.clear();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  }
}
