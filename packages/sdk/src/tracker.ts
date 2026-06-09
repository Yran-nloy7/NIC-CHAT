/**
 * AIMonitor — the main class that wraps an SSE stream and tracks metrics.
 *
 * Usage:
 *   const monitor = new AIMonitor({ endpoint: '/api/metrics' });
 *   monitor.start('my-request-id');
 *   // ... call recordChunk() for each received chunk ...
 *   monitor.complete(); // or monitor.error('timeout');
 */

import { createTiming, recordChunk, finalizeMetrics, type StreamTiming, type StreamMetrics } from './metrics';
import { Reporter, type ReporterConfig } from './reporter';

export interface AIMonitorConfig extends ReporterConfig {
  /** Threshold in ms for classifying a gap as a stall (default 500) */
  stallThreshold?: number;
  /** Auto-report metrics on stream complete/error */
  autoReport?: boolean;
  /** Called with final metrics for custom handling */
  onMetrics?: (metrics: StreamMetrics) => void;
}

type ResolvedConfig = Required<Omit<AIMonitorConfig, 'onMetrics'>> & Pick<AIMonitorConfig, 'onMetrics'>;

export class AIMonitor {
  private config: ResolvedConfig;
  private reporter: Reporter;
  private timing: StreamTiming | null = null;
  private requestId: string | null = null;

  constructor(config: AIMonitorConfig = {}) {
    this.config = {
      endpoint: config.endpoint ?? '/api/metrics',
      useBeacon: config.useBeacon ?? true,
      maxRetries: config.maxRetries ?? 3,
      stallThreshold: config.stallThreshold ?? 500,
      autoReport: config.autoReport ?? true,
      onMetrics: config.onMetrics,
    };
    this.reporter = new Reporter({
      endpoint: this.config.endpoint,
      useBeacon: this.config.useBeacon,
      maxRetries: this.config.maxRetries,
    });
  }

  start(requestId: string): void {
    this.requestId = requestId;
    this.timing = createTiming();
  }

  recordChunk(charCount: number): void {
    if (!this.timing) return;
    recordChunk(this.timing, charCount, this.config.stallThreshold);
  }

  getMetrics(): StreamMetrics | null {
    if (!this.timing) return null;
    return finalizeMetrics(this.timing, this.config.stallThreshold);
  }

  complete(): StreamMetrics | null {
    if (!this.timing) return null;
    this.timing.completed = true;
    const metrics = finalizeMetrics(this.timing, this.config.stallThreshold);

    if (this.config.autoReport) {
      this.reporter.report({
        requestId: this.requestId,
        timestamp: Date.now(),
        ...metrics,
      });
    }

    this.config.onMetrics?.(metrics);
    this.timing = null;
    return metrics;
  }

  error(message: string): StreamMetrics | null {
    if (!this.timing) return null;
    this.timing.error = message;
    this.timing.completed = false;
    const metrics = finalizeMetrics(this.timing, this.config.stallThreshold);

    if (this.config.autoReport) {
      this.reporter.report({
        requestId: this.requestId,
        timestamp: Date.now(),
        ...metrics,
      });
    }

    this.config.onMetrics?.(metrics);
    this.timing = null;
    return metrics;
  }

  /** Get the reporter for manual queue management */
  getReporter(): Reporter {
    return this.reporter;
  }
}
