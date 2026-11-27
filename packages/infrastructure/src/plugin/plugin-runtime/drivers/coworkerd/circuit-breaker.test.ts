import { describe, expect, it, vi } from 'vitest';

import { createError } from '@domain/value-objects/error.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

import { CircuitBreaker } from './circuit-breaker';

describe('Coworkerd CircuitBreaker', () => {
  it('starts in closed state and resets consecutive failures on success', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });
    expect(cb.getState()).toBe('closed');
    expect(cb.isAvailable()).toBe(true);

    await cb.execute(async () => 'ok');
    expect(cb.getStats().consecutiveFailures).toBe(0);
  });

  it('does not count application or worker quota errors toward circuit breaking', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2 });
    const cpuError = createError(ErrorCode.pluginInvokeCpuLimitExceeded, { message: 'CPU limit' });
    const appError = createError(ErrorCode.pluginInvokeFailed, { message: 'Handler error' });

    await expect(cb.execute(async () => { throw cpuError; })).rejects.toThrow('CPU limit');
    expect(cb.getStats().consecutiveFailures).toBe(0);
    expect(cb.getState()).toBe('closed');

    await expect(cb.execute(async () => { throw appError; })).rejects.toThrow('Handler error');
    expect(cb.getStats().consecutiveFailures).toBe(0);
    expect(cb.getState()).toBe('closed');
  });

  it('trips from closed to open when transport failures reach threshold', async () => {
    const changes: string[] = [];
    const cb = new CircuitBreaker({
      failureThreshold: 2,
      resetTimeoutMs: 100,
      onStateChange: (from, to) => changes.push(`${from}->${to}`)
    });

    const transportError = new TypeError('fetch failed');

    await expect(cb.execute(async () => { throw transportError; })).rejects.toThrow();
    expect(cb.getStats().consecutiveFailures).toBe(1);
    expect(cb.getState()).toBe('closed');

    await expect(cb.execute(async () => { throw transportError; })).rejects.toThrow();
    expect(cb.getStats().consecutiveFailures).toBe(2);
    expect(cb.getState()).toBe('open');
    expect(cb.isAvailable()).toBe(false);
    expect(changes).toEqual(['closed->open']);

    // Subsequent call fails fast without executing action
    const action = vi.fn(async () => 'ok');
    await expect(cb.execute(action)).rejects.toThrow(/circuit breaker is open/);
    expect(action).not.toHaveBeenCalled();
  });

  it('transitions to half_open after cool-down and resets to closed on probe success', async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      resetTimeoutMs: 20
    });

    await expect(cb.execute(async () => { throw new TypeError('fetch failed'); })).rejects.toThrow();
    expect(cb.getState()).toBe('open');

    // Wait for reset timeout
    await new Promise((r) => setTimeout(r, 30));
    expect(cb.getState()).toBe('half_open');

    // Probe success closes the breaker
    const res = await cb.execute(async () => 'recovered');
    expect(res).toBe('recovered');
    expect(cb.getState()).toBe('closed');
    expect(cb.getStats().consecutiveFailures).toBe(0);
  });

  it('transitions back to open when probe in half_open fails with transport error', async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      resetTimeoutMs: 20
    });

    await expect(cb.execute(async () => { throw new TypeError('fetch failed'); })).rejects.toThrow();
    await new Promise((r) => setTimeout(r, 30));
    expect(cb.getState()).toBe('half_open');

    await expect(cb.execute(async () => { throw new TypeError('fetch failed again'); })).rejects.toThrow();
    expect(cb.getState()).toBe('open');
  });

  it('considers cluster alive if probe in half_open fails with non-transport worker error', async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      resetTimeoutMs: 20
    });

    await expect(cb.execute(async () => { throw new TypeError('fetch failed'); })).rejects.toThrow();
    await new Promise((r) => setTimeout(r, 30));
    expect(cb.getState()).toBe('half_open');

    const appError = createError(ErrorCode.pluginInvokeFailed, { message: 'Handler threw' });
    await expect(cb.execute(async () => { throw appError; })).rejects.toThrow('Handler threw');
    expect(cb.getState()).toBe('closed');
  });
});
