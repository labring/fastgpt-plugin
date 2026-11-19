import { describe, expect, it, vi } from 'vitest';

import { failureResult, successResult } from '@domain/value-objects/result.vo';

import { CircuitBreaker } from './circuit-breaker';
import type { CoworkerdStatusResponse } from './coworkerd-api.client';
import { HealthChecker } from './health-checker';

describe('Coworkerd HealthChecker', () => {
  it('marks healthy and resets circuit breaker when reachable nodes exist', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2 });
    const api = {
      getStatus: vi.fn(async () => successResult<CoworkerdStatusResponse>({
        storage: { tenantsRevision: '1' },
        nodes: [{ nodeId: 'n1', reachable: true, state: 'active' }]
      }))
    };

    const hc = new HealthChecker({ api, circuitBreaker: cb, probeIntervalMs: 0 });
    const [result, error] = await hc.checkHealth();
    expect(error).toBeNull();
    expect(result?.healthy).toBe(true);
    expect(result?.reachableNodes).toBe(1);
    expect(cb.getState()).toBe('closed');
  });

  it('records circuit breaker failure when all nodes are unreachable or draining', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1 });
    const api = {
      getStatus: vi.fn(async () => successResult<CoworkerdStatusResponse>({
        storage: { tenantsRevision: '1' },
        nodes: [{ nodeId: 'n1', reachable: false, state: 'draining' }]
      }))
    };

    const hc = new HealthChecker({ api, circuitBreaker: cb, probeIntervalMs: 0 });
    const [result, error] = await hc.checkHealth();
    expect(error).toBeNull();
    expect(result?.healthy).toBe(false);
    expect(result?.reachableNodes).toBe(0);
    expect(cb.getState()).toBe('open');
  });

  it('records circuit breaker failure when getStatus returns a transport error', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1 });
    const api = {
      getStatus: vi.fn(async () => failureResult({
        reason: { en: 'Connect refused', 'zh-CN': '连接被拒绝' },
        code: 'NETWORK_ERROR',
        error: new TypeError('fetch failed')
      } as any))
    };

    const hc = new HealthChecker({ api, circuitBreaker: cb, probeIntervalMs: 0 });
    const [result, error] = await hc.checkHealth();
    expect(error).not.toBeNull();
    expect(result).toBeNull();
    expect(cb.getState()).toBe('open');
  });
});
