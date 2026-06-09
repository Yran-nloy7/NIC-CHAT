/**
 * Custom SSE client built on Fetch + ReadableStream.
 *
 * Why not EventSource?
 * - EventSource only supports GET (no POST body, no custom headers)
 * - No way to pass auth tokens
 * - Cannot control reconnection strategy precisely
 */

export interface SSEEvent {
  event: string;
  data: string;
}

export interface SSEOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  onEvent?: (event: SSEEvent) => void;
}

/**
 * Connect to an SSE endpoint via POST and yield parsed events.
 * Uses an async generator so the caller can iterate with for-await-of.
 */
export async function* sseConnect(
  url: string,
  body: unknown,
  options: SSEOptions = {},
): AsyncGenerator<SSEEvent, void, undefined> {
  const controller = new AbortController();
  const signal = options.signal;

  // Chain abort signals
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...options.headers,
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  });

  if (!response.ok) {
    throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('ReadableStream not supported');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last (potentially incomplete) line in buffer
      buffer = lines.pop() || '';

      let currentEvent = '';
      let currentData = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          currentData = line.slice(6);
        } else if (line.trim() === '' && currentData) {
          // Empty line = end of event
          const parsed: SSEEvent = {
            event: currentEvent || 'message',
            data: currentData,
          };
          options.onEvent?.(parsed);
          yield parsed;
          currentEvent = '';
          currentData = '';
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      const parsed: SSEEvent = { event: 'message', data: buffer };
      yield parsed;
    }
  } finally {
    reader.releaseLock();
  }
}
