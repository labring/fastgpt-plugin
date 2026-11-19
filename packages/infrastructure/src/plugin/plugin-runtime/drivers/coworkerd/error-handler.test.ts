import { describe, expect, it } from 'vitest';

import { ErrorCode } from '@infrastructure/errors/error.registry';

import {
  isClusterTransportFailure,
  mapCoworkerdApiError,
  mapCoworkerdHttpError,
  mapErrorToFailureKind
} from './error-handler';

describe('Coworkerd error handler', () => {
  it('maps HTTP 503 with CPU limit code to pluginInvokeCpuLimitExceeded', async () => {
    const response = new Response(JSON.stringify({ code: 'CPU_LIMIT_EXCEEDED', reason: 'exceeded 200ms CPU' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
    const error = await mapCoworkerdHttpError(response);
    expect(error.code).toBe(ErrorCode.pluginInvokeCpuLimitExceeded);
    expect(error.httpStatus).toBe(504);
    expect(error.telemetryKind).toBe('cpu_limit_exceeded');
    expect(mapErrorToFailureKind(error)).toBe('cpu_limit_exceeded');
    expect(isClusterTransportFailure(error, 503)).toBe(false);
  });

  it('maps HTTP 503 with memory limit code to pluginInvokeMemoryLimitExceeded', async () => {
    const response = new Response(JSON.stringify({ code: 'MEMORY_LIMIT_EXCEEDED', reason: 'exceeded 128MB memory' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
    const error = await mapCoworkerdHttpError(response);
    expect(error.code).toBe(ErrorCode.pluginInvokeMemoryLimitExceeded);
    expect(error.httpStatus).toBe(503);
    expect(error.telemetryKind).toBe('memory_limit_exceeded');
    expect(mapErrorToFailureKind(error)).toBe('memory_limit_exceeded');
    expect(isClusterTransportFailure(error, 503)).toBe(false);
  });

  it('maps generic HTTP 503 without quota code to cluster unavailable and treats as transport failure', async () => {
    const response = new Response('Service Unavailable (node restarting)', {
      status: 503
    });
    const error = await mapCoworkerdHttpError(response);
    expect(error.code).toBe(ErrorCode.pluginRuntimeClusterUnavailable);
    expect(error.httpStatus).toBe(503);
    expect(isClusterTransportFailure(error, 503)).toBe(true);
    expect(mapErrorToFailureKind(error)).toBe('cluster_unavailable');
  });

  it('maps HTTP 422 LOAD_FAILED to pluginRuntimeTrialLoadFailed', async () => {
    const response = new Response(JSON.stringify({ code: 'LOAD_FAILED', reason: 'Uncaught SyntaxError' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' }
    });
    const error = await mapCoworkerdHttpError(response);
    expect(error.code).toBe(ErrorCode.pluginRuntimeTrialLoadFailed);
    expect(error.httpStatus).toBe(422);
    expect(mapErrorToFailureKind(error)).toBe('trial_load_failed');
    expect(isClusterTransportFailure(error, 422)).toBe(false);
  });

  it('maps HTTP 404 ROUTE_NOT_FOUND to pluginRuntimePluginNotFound', async () => {
    const response = new Response(JSON.stringify({ code: 'ROUTE_NOT_FOUND', reason: 'Worker not routed' }), {
      status: 404
    });
    const error = await mapCoworkerdHttpError(response);
    expect(error.code).toBe(ErrorCode.pluginRuntimePluginNotFound);
    expect(isClusterTransportFailure(error, 404)).toBe(false);
  });

  it('maps HTTP 405 METHOD_NOT_ALLOWED to pluginRuntimeEventNotSupported', async () => {
    const response = new Response(JSON.stringify({ code: 'METHOD_NOT_ALLOWED' }), {
      status: 405
    });
    const error = await mapCoworkerdHttpError(response);
    expect(error.code).toBe(ErrorCode.pluginRuntimeEventNotSupported);
    expect(isClusterTransportFailure(error, 405)).toBe(false);
  });

  it('maps HTTP 500 EXECUTION_FAILED to pluginInvokeFailed and does not trip circuit breaker', async () => {
    const response = new Response(JSON.stringify({ code: 'EXECUTION_FAILED', reason: 'Plugin handler threw an exception' }), {
      status: 500
    });
    const error = await mapCoworkerdHttpError(response);
    expect(error.code).toBe(ErrorCode.pluginInvokeFailed);
    expect(isClusterTransportFailure(error, 500)).toBe(false);
  });

  it('maps HTTP 502 / 504 to cluster unavailable and treats as transport failure', async () => {
    for (const status of [502, 504]) {
      const response = new Response('Gateway error', { status });
      const error = await mapCoworkerdHttpError(response);
      expect(error.code).toBe(ErrorCode.pluginRuntimeClusterUnavailable);
      expect(isClusterTransportFailure(error, status)).toBe(true);
    }
  });

  it('maps network errors to cluster unavailable and identifies them as transport failures', () => {
    const networkErr = new TypeError('fetch failed');
    const apiErr = { code: 'NETWORK_ERROR', message: 'connect ECONNREFUSED 127.0.0.1:18090', error: new Error('connect ECONNREFUSED') };
    expect(isClusterTransportFailure(networkErr)).toBe(true);
    expect(isClusterTransportFailure(apiErr)).toBe(true);
    const mapped = mapCoworkerdApiError(apiErr);
    expect(mapped.code).toBe(ErrorCode.pluginRuntimeClusterUnavailable);
  });

  it('maps API LOAD_FAILED errors to trial_load_failed', () => {
    const apiErr = { code: 'LOAD_FAILED', message: 'trial load failed', data: { status: 422 } };
    const mapped = mapCoworkerdApiError(apiErr);
    expect(mapped.code).toBe(ErrorCode.pluginRuntimeTrialLoadFailed);
    expect(mapErrorToFailureKind(mapped)).toBe('trial_load_failed');
  });
});
