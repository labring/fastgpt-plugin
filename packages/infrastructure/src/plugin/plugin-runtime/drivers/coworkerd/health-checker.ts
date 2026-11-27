import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';

import { CircuitBreaker } from './circuit-breaker';
import type { CoworkerdApiClient } from './coworkerd-api.client';
import type { CoworkerdStatusResponse } from './types';

export type HealthCheckResult = {
  healthy: boolean;
  reachableNodes: number;
  totalNodes: number;
  statusResponse?: CoworkerdStatusResponse;
};

export type HealthCheckerOptions = {
  api: Pick<CoworkerdApiClient, 'getStatus'>;
  circuitBreaker: CircuitBreaker;
  /** Probe interval in milliseconds. Set to 0 or negative to disable background timer. Default: 30_000 ms. */
  probeIntervalMs?: number;
  onHealthStatus?: (status: HealthCheckResult) => void;
};

export class HealthChecker {
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private readonly api: Pick<CoworkerdApiClient, 'getStatus'>;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly probeIntervalMs: number;
  private readonly onHealthStatus?: (status: HealthCheckResult) => void;

  constructor(options: HealthCheckerOptions) {
    this.api = options.api;
    this.circuitBreaker = options.circuitBreaker;
    this.probeIntervalMs = options.probeIntervalMs ?? 30_000;
    this.onHealthStatus = options.onHealthStatus;
  }

  start(): void {
    if (this.timer || this.probeIntervalMs <= 0) return;
    this.timer = setInterval(() => {
      void this.checkHealth();
    }, this.probeIntervalMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  async checkHealth(): Promise<Result<HealthCheckResult>> {
    if (this.running) {
      return successResult({
        healthy: this.circuitBreaker.isAvailable(),
        reachableNodes: 0,
        totalNodes: 0
      });
    }

    this.running = true;
    try {
      const [status, error] = await this.api.getStatus();

      if (error) {
        this.circuitBreaker.recordFailure(error);
        const result: HealthCheckResult = {
          healthy: false,
          reachableNodes: 0,
          totalNodes: 0
        };
        this.onHealthStatus?.(result);
        return failureResult(error);
      }

      const nodes = status.nodes ?? [];
      const reachableNodes = nodes.filter(
        (n) => n.reachable === true && !n.drain?.draining && n.state !== 'draining'
      ).length;

      const healthy = nodes.length === 0 || reachableNodes > 0;

      if (healthy) {
        this.circuitBreaker.recordSuccess();
      } else {
        this.circuitBreaker.recordFailure(new Error('All nodes in cluster are unreachable or draining'));
      }

      const result: HealthCheckResult = {
        healthy,
        reachableNodes,
        totalNodes: nodes.length,
        statusResponse: status
      };

      this.onHealthStatus?.(result);
      return successResult(result);
    } finally {
      this.running = false;
    }
  }
}
