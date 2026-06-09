/**
 * Unified adapter interface — every AI provider implements this.
 * The gateway server calls these, independent of the provider underneath.
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  apiKey?: string;
  endpoint?: string;
  systemPrompt?: string;
}

export interface SSEGatewayEvent {
  event: 'state' | 'text' | 'thinking' | 'tool_call' | 'tool_result' | 'error';
  data: unknown;
}

export interface ModelInfo {
  id: string;
  name: string;
  owned_by?: string;
}

export interface ChatAdapter {
  /** Stream a chat completion, calling onEvent for each SSE event */
  stream(req: ChatRequest, onEvent: (evt: SSEGatewayEvent) => void): Promise<void>;

  /** List available models (optional — returns empty if not supported) */
  listModels?(apiKey?: string, endpoint?: string): Promise<ModelInfo[]>;
}

export type ProviderType = 'openai' | 'claude' | 'ollama';
