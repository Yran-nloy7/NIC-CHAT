/**
 * Finite State Machine for AI message lifecycle.
 *
 * States:
 *   idle → thinking → tool_calling → answering → completed
 *
 * Valid transitions ensure UI never enters an impossible state,
 * especially during rapid tool-call sequences or stream restarts.
 */

export type MessageState = 'idle' | 'thinking' | 'tool_calling' | 'answering' | 'completed' | 'error';

const VALID_TRANSITIONS: Record<MessageState, MessageState[]> = {
  idle: ['thinking'],
  thinking: ['tool_calling', 'answering', 'completed', 'error'],
  tool_calling: ['thinking', 'answering', 'completed', 'error'],
  answering: ['tool_calling', 'completed', 'error'],
  completed: [], // terminal
  error: ['idle'], // can reset
};

export type StateChangeHandler = (from: MessageState, to: MessageState) => void;

export class MessageFSM {
  private _state: MessageState = 'idle';
  private listeners: Set<StateChangeHandler> = new Set();

  get state(): MessageState {
    return this._state;
  }

  transition(to: MessageState): boolean {
    const allowed = VALID_TRANSITIONS[this._state];
    if (!allowed.includes(to)) {
      console.warn(`[FSM] Invalid transition: ${this._state} → ${to} (allowed: ${allowed.join(', ')})`);
      return false;
    }
    const from = this._state;
    this._state = to;
    this.listeners.forEach(fn => fn(from, to));
    return true;
  }

  onChange(fn: StateChangeHandler): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  reset(): void {
    this._state = 'idle';
  }

  isTerminal(): boolean {
    return this._state === 'completed' || this._state === 'error';
  }

  isActive(): boolean {
    return this._state !== 'idle' && !this.isTerminal();
  }
}
