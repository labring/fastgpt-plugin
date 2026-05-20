import type { PodStats, ServiceMetrics } from '../types';

import type { ServiceConfig } from './types';

const MAX_RESPONSE_TIME_SAMPLES = 1000;

export class ServiceStats {
  private totalRequests = 0;
  private completedRequests = 0;
  private failedRequests = 0;
  private crashCount = 0;
  private responseTimes: number[] = [];

  recordRequest(): void {
    this.totalRequests++;
  }

  recordCompleted(duration: number): void {
    this.completedRequests++;
    this.responseTimes.push(duration);
    if (this.responseTimes.length > MAX_RESPONSE_TIME_SAMPLES) {
      this.responseTimes.shift();
    }
  }

  recordFailed(): void {
    this.failedRequests++;
  }

  recordCrash(): void {
    this.crashCount++;
  }

  toMetrics(pods: PodStats, queueLength: number, config: ServiceConfig): ServiceMetrics {
    const responseTime = this.getResponseTimeStats();

    return {
      pods,
      queueLength,
      responseTime,
      rps: 0,
      errorRate: this.totalRequests > 0 ? this.failedRequests / this.totalRequests : 0,
      crashCount: this.crashCount,
      totalRequests: this.totalRequests,
      maxPods: config.maxPods,
      minPods: config.minPods
    };
  }

  private getResponseTimeStats(): { avg: number; p95: number } {
    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    if (sortedTimes.length === 0) {
      return { avg: 0, p95: 0 };
    }

    const avg = sortedTimes.reduce((sum, duration) => sum + duration, 0) / sortedTimes.length;
    const p95Index = Math.floor(sortedTimes.length * 0.95);

    return {
      avg,
      p95: sortedTimes[p95Index] ?? sortedTimes[sortedTimes.length - 1]
    };
  }
}
