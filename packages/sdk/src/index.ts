/**
 * @ai-chat/sdk — AI Chat Stream Monitor
 *
 * Lightweight (<5KB gzipped) SDK for tracking AI streaming performance:
 * - TTFB (Time To First Byte)
 * - TTLB (Time To Last Byte)
 * - Stall count & latency distribution
 * - Offline queue with IndexedDB + sendBeacon
 */

export { AIMonitor } from './tracker';
export type { AIMonitorConfig } from './tracker';
export { Reporter } from './reporter';
export type { ReporterConfig } from './reporter';
export { createTiming, recordChunk, finalizeMetrics } from './metrics';
export type { StreamTiming, StreamMetrics } from './metrics';
export { enqueue, dequeueAll, getQueueSize } from './queue';
