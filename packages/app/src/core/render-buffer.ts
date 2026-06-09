/**
 * rAF-based render buffer — caps React re-renders to at most 1 per frame.
 *
 * Problem: AI streams chunks every 30-50ms (20-33 Hz). Each chunk triggers
 * a React setState → re-render → layout recalc. At 33 updates/sec, the
 * browser main thread is saturated, causing visible jank.
 *
 * Solution: Accumulate chunks in a buffer, flush once per rAF (~16ms).
 * This reduces renders to ≤60 fps, leaving the browser idle time for
 * painting and input handling.
 */

type FlushFn = (text: string) => void;

export class RenderBuffer {
  private buffer: string[] = [];
  private flushFn: FlushFn;
  private rafId: number | null = null;
  private _enabled = true;

  constructor(flushFn: FlushFn) {
    this.flushFn = flushFn;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  setEnabled(v: boolean): void {
    this._enabled = v;
    // Flush immediately when disabling (go back to direct mode)
    if (!v) this.flushNow();
  }

  push(text: string): void {
    if (!this._enabled) {
      this.flushFn(text);
      return;
    }
    this.buffer.push(text);
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.rafId !== null) return; // already scheduled
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      if (this.buffer.length > 0) {
        const merged = this.buffer.join('');
        this.buffer = [];
        this.flushFn(merged);
      }
    });
  }

  flushNow(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.buffer.length > 0) {
      const merged = this.buffer.join('');
      this.buffer = [];
      this.flushFn(merged);
    }
  }

  destroy(): void {
    this.flushNow();
  }
}
