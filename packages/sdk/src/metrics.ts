/**
 * AI-specific stream metrics.
 *
 * These go beyond traditional web vitals (FCP, LCP) and measure what
 * actually matters for AI chat experiences.
 */

export interface StreamMetrics {
  /** Time To First Byte — ms from request to first data chunk */
  ttfb: number;
  /** Time To Last Byte — ms from request to stream completion */
  ttlb: number;
  /** Total number of chunks received */
  chunkCount: number;
  /** Number of times gap between chunks exceeded stallThreshold (default 500ms) */
  stallCount: number;
  /** Total characters received */
  totalChars: number;
  /** Average inter-chunk latency in ms */
  avgChunkLatency: number;
  /** Maximum inter-chunk latency in ms */
  maxChunkLatency: number;
  /** Was the stream completed normally (vs. error/abort) */
  completed: boolean;
  /** Any error that occurred */
  error?: string;
}

export interface StreamTiming {
  startTime: number;
  firstChunkTime: number;
  lastChunkTime: number;
  previousChunkTime: number;
  chunkCount: number;
  stallCount: number;
  totalChars: number;
  chunkLatencies: number[];
  completed: boolean;
  error?: string;
}

export function createTiming(): StreamTiming {
  const now = performance.now();
  return {
    startTime: now,
    firstChunkTime: 0,
    lastChunkTime: 0,
    previousChunkTime: now,
    chunkCount: 0,
    stallCount: 0,
    totalChars: 0,
    chunkLatencies: [],
    completed: false,
  };
}

export function recordChunk(timing: StreamTiming, charCount: number, stallThreshold = 500): void {
  const now = performance.now();

  if (timing.chunkCount === 0) {
    timing.firstChunkTime = now;
  }

  const gap = now - timing.previousChunkTime;
  if (timing.chunkCount > 0 && gap > stallThreshold) {
    timing.stallCount++;
  }

  timing.chunkLatencies.push(gap);
  timing.lastChunkTime = now;
  timing.previousChunkTime = now;
  timing.chunkCount++;
  timing.totalChars += charCount;
}

export function finalizeMetrics(timing: StreamTiming, stallThreshold = 500): StreamMetrics {
  const latencies = timing.chunkLatencies.slice(1); // skip first (no previous chunk)
  const avgLatency = latencies.length > 0
    ? latencies.reduce((a, b) => a + b, 0) / latencies.length
    : 0;
  const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;

  return {
    ttfb: timing.firstChunkTime ? timing.firstChunkTime - timing.startTime : 0,
    ttlb: timing.lastChunkTime ? timing.lastChunkTime - timing.startTime : 0,
    chunkCount: timing.chunkCount,
    stallCount: timing.stallCount,
    totalChars: timing.totalChars,
    avgChunkLatency: Math.round(avgLatency * 100) / 100,
    maxChunkLatency: Math.round(maxLatency * 100) / 100,
    completed: timing.completed,
    error: timing.error,
  };
}
