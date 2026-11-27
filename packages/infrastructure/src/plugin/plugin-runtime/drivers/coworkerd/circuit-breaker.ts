import { createError } from '@domain/value-objects/error.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

import { isClusterTransportFailure } from './error-handler';

export type CircuitBreakerState = 'closed' | 'open' | 'half_open';

export type CircuitBreakerOptions = {
  /** Number of consecutive cluster transport failures required to trip the breaker. Default: 5. */
  failureThreshold?: number;
  /** Duration in milliseconds that the breaker stays open before attempting half-open recovery. Default: 15_000 ms. */
  resetTimeoutMs?: number;
  /** Maximum number of probe requests permitted in half-open state. Default: 1. */
  halfOpenMaxCalls?: number;
  /** Optional callback fired when state changes. */
  onStateChange?: (from: CircuitBreakerState, to: CircuitBreakerState) => void;
};

export class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private consecutiveFailures = 0;
  private lastFailureTimestamp = 0;
  private halfOpenCalls = 0;

  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly halfOpenMaxCalls: number;
  private readonly onStateChange?: (from: CircuitBreakerState, to: CircuitBreakerState) => void;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = Math.max(1, options.failureThreshold ?? 5);
    this.resetTimeoutMs = Math.max(1, options.resetTimeoutMs ?? 15_000);
    this.halfOpenMaxCalls = Math.max(1, options.halfOpenMaxCalls ?? 1);
    this.onStateChange = options.onStateChange;
  }

  getState(): CircuitBreakerState {
    this.evaluateState();
    return this.state;
  }

  isAvailable(): boolean {
    this.evaluateState();
    return this.state !== 'open';
  }

  getStats() {
    this.evaluateState();
    return {
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      failureThreshold: this.failureThreshold,
      resetTimeoutMs: this.resetTimeoutMs,
      lastFailureTime: this.lastFailureTimestamp ? new Date(this.lastFailureTimestamp) : undefined
    };
  }

  /**
   * Executes an asynchronous action protected by the circuit breaker.
   * Rejects immediately when the breaker is open.
   */
  async execute<T>(action: () => Promise<T>): Promise<T> {
    this.evaluateState();

    if (this.state === 'open') {
      throw createError(ErrorCode.pluginRuntimeClusterUnavailable, {
        message: 'Coworkerd cluster circuit breaker is open; failing fast without calling network'
      });
    }

    if (this.state === 'half_open') {
      if (this.halfOpenCalls >= this.halfOpenMaxCalls) {
        throw createError(ErrorCode.pluginRuntimeClusterUnavailable, {
          message: 'Coworkerd cluster circuit breaker is half-open (recovery probe in progress)'
        });
      }
      this.halfOpenCalls++;
    }

    try {
      const result = await action();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error);
      throw error;
    }
  }

  recordSuccess(): void {
    if (this.state === 'half_open') {
      this.transitionTo('closed');
    }
    this.consecutiveFailures = 0;
    this.halfOpenCalls = 0;
  }

  recordFailure(error: unknown, status?: number): void {
    if (!isClusterTransportFailure(error, status)) {
      if (this.state === 'half_open') {
        // Application / worker execution errors mean the cluster itself is reachable.
        this.transitionTo('closed');
        this.consecutiveFailures = 0;
        this.halfOpenCalls = 0;
      }
      return;
    }

    this.lastFailureTimestamp = Date.now();

    if (this.state === 'half_open') {
      this.transitionTo('open');
      this.halfOpenCalls = 0;
      return;
    }

    if (this.state === 'closed') {
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= this.failureThreshold) {
        this.transitionTo('open');
      }
    }
  }

  reset(): void {
    this.transitionTo('closed');
    this.consecutiveFailures = 0;
    this.lastFailureTimestamp = 0;
    this.halfOpenCalls = 0;
  }

  private evaluateState(): void {
    if (this.state === 'open') {
      const elapsed = Date.now() - this.lastFailureTimestamp;
      if (elapsed >= this.resetTimeoutMs) {
        this.transitionTo('half_open');
        this.halfOpenCalls = 0;
      }
    }
  }

  private transitionTo(newState: CircuitBreakerState): void {
    if (this.state === newState) return;
    const oldState = this.state;
    this.state = newState;
    this.onStateChange?.(oldState, newState);
  }
}
