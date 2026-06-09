/**
 * Gateway — routes chat requests to the right AI provider adapter.
 * Speaks unified SSE protocol to the frontend.
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { openaiAdapter } from './adapters/openai';
import { claudeAdapter } from './adapters/claude';
import { ollamaAdapter } from './adapters/ollama';
import type { ChatAdapter, ProviderType, ChatRequest, SSEGatewayEvent, ModelInfo } from './adapters/types';

const adapters: Record<ProviderType, ChatAdapter> = {
  openai: openaiAdapter,
  claude: claudeAdapter,
  ollama: ollamaAdapter,
};

export async function handleChat(req: IncomingMessage, res: ServerResponse, body: any): Promise<void> {
  const {
    messages,
    provider = 'openai',
    model,
    apiKey,
    endpoint,
    systemPrompt,
  } = (body || {}) as ChatRequest & { provider?: ProviderType; apiKey?: string };

  const adapter = adapters[provider] ?? adapters.openai;

  // SSE headers — MUST flush immediately so the client sees the response
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  let aborted = false;
  req.on('close', () => { aborted = true; });

  // Batch writes: Node.js TCP buffers small writes. Accumulate and flush periodically.
  let batch = '';
  let flushTimer: NodeJS.Timeout | null = null;

  const doFlush = () => {
    if (aborted || !batch) return;
    res.write(batch);
    batch = '';
    flushTimer = null;
  };

  const send = (evt: SSEGatewayEvent): void => {
    if (aborted) return;
    batch += `event: ${evt.event}\ndata: ${JSON.stringify(evt.data)}\n\n`;
    if (!flushTimer) flushTimer = setTimeout(doFlush, 25); // flush every 25ms
  };

  // Send initial keepalive immediately
  res.write(':connected\n\n');

  await adapter.stream(
    { messages: messages || [], model, apiKey, endpoint, systemPrompt },
    (evt) => { if (!aborted) send(evt); },
  );

  // Final flush
  doFlush();
  if (!aborted) res.end();
}

export async function handleListModels(provider: string, apiKey: string, endpoint: string): Promise<ModelInfo[]> {
  const adapter = adapters[provider as ProviderType] ?? adapters.openai;
  if (!adapter.listModels) return [];
  try {
    return await adapter.listModels(apiKey, endpoint);
  } catch {
    return [];
  }
}
