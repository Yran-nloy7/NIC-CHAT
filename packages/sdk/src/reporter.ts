/**
 * Dual-channel reporter for stream metrics.
 *
 * Channel 1: navigator.sendBeacon — fires on page unload, guarantees data delivery
 * Channel 2: fetch — used for normal in-session reporting
 */

import { enqueue, dequeueAll } from './queue';

export interface ReporterConfig {
  /** Endpoint to send metrics to (default: '/api/metrics') */
  endpoint?: string;
  /** Whether to use sendBeacon for unload reporting */
  useBeacon?: boolean;
  /** Max retries for offline queue */
  maxRetries?: number;
}

const DEFAULT_CONFIG: Required<ReporterConfig> = {
  endpoint: '/api/metrics',
  useBeacon: true,
  maxRetries: 3,
};

export class Reporter {
  private config: Required<ReporterConfig>;
  private flushScheduled = false;

  constructor(config: ReporterConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupUnloadHandler();
    this.setupOnlineHandler();
  }

  async report(metrics: unknown): Promise<void> {
    try {
      const ok = await this.send(metrics);
      if (!ok) {
        await enqueue(metrics);
      }
    } catch {
      await enqueue(metrics);
    }
  }

  private async send(data: unknown): Promise<boolean> {
    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private setupUnloadHandler(): void {
    if (!this.config.useBeacon) return;

    const handler = () => {
      // Flush queue via beacon on page unload
      dequeueAll().then(items => {
        for (const item of items) {
          navigator.sendBeacon(
            this.config.endpoint,
            JSON.stringify(item.payload),
          );
        }
      });
    };

    window.addEventListener('beforeunload', handler);
    window.addEventListener('pagehide', handler);
  }

  private setupOnlineHandler(): void {
    window.addEventListener('online', () => {
      if (this.flushScheduled) return;
      this.flushScheduled = true;
      this.flushQueue();
    });
  }

  private async flushQueue(): Promise<void> {
    const items = await dequeueAll();
    for (const item of items) {
      const ok = await this.send(item.payload);
      if (!ok) {
        await enqueue(item.payload); // re-queue on failure
        break;
      }
    }
    this.flushScheduled = false;
  }
}
