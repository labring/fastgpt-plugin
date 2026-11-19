import { createError, RegisteredError } from '@domain/value-objects/error.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';
import type { RuntimeFailureKind } from '@infrastructure/metrics';

export type CoworkerdErrorPayload = {
  status?: number;
  code?: string;
  reason?: string;
  [key: string]: unknown;
};

/**
 * Maps Coworkerd Ingress HTTP error response to a domain RegisteredError.
 * Distinguishes CPU/memory limits, trial load failure, route not found, and transport issues.
 */
export async function mapCoworkerdHttpError(response: Response): Promise<RegisteredError> {
  const status = response.status;
  let code = `HTTP_${status}`;
  let reason = response.statusText || 'Error';

  try {
    const text = await response.text();
    try {
      const json = JSON.parse(text) as { code?: string; reason?: string; message?: string };
      code = json.code ?? code;
      reason = json.reason ?? json.message ?? text;
    } catch {
      reason = text || reason;
    }
  } catch {
    // keep defaults
  }

  const normalizedCode = code.toUpperCase();
  const normalizedReason = reason.toLowerCase();

  // 1. 503 CPU Limit Exceeded
  if (
    status === 503 &&
    (normalizedCode.includes('CPU') || normalizedReason.includes('cpu time') || normalizedReason.includes('cpu limit'))
  ) {
    return createError(ErrorCode.pluginInvokeCpuLimitExceeded, {
      message: `Coworkerd CPU limit exceeded: ${reason}`,
      data: { status, code, reason }
    });
  }

  // 2. 503 Memory Limit Exceeded
  if (
    status === 503 &&
    (normalizedCode.includes('MEMORY') || normalizedReason.includes('memory limit') || normalizedReason.includes('out of memory'))
  ) {
    return createError(ErrorCode.pluginInvokeMemoryLimitExceeded, {
      message: `Coworkerd memory limit exceeded: ${reason}`,
      data: { status, code, reason }
    });
  }

  // 3. 422 Trial Load Failed
  if (status === 422 || normalizedCode === 'LOAD_FAILED') {
    return createError(ErrorCode.pluginRuntimeTrialLoadFailed, {
      message: `Coworkerd trial load failed: ${reason}`,
      data: { status, code, reason }
    });
  }

  // 4. 404 Route / Worker Not Found
  if (status === 404 || normalizedCode === 'ROUTE_NOT_FOUND') {
    return createError(ErrorCode.pluginRuntimePluginNotFound, {
      message: `Coworkerd worker route not found: ${reason}`,
      data: { status, code, reason }
    });
  }

  // 5. 405 Method Not Allowed / Event Not Supported
  if (status === 405 || normalizedCode === 'METHOD_NOT_ALLOWED' || normalizedCode === 'EVENT_NOT_SUPPORTED') {
    return createError(ErrorCode.pluginRuntimeEventNotSupported, {
      message: `Coworkerd method not allowed or event not supported: ${reason}`,
      data: { status, code, reason }
    });
  }

  // 6. 502 / 504 or other 503 without specific limit: Cluster Gateway / Transport Unavailability
  if (status === 502 || status === 504 || status === 503) {
    return createError(ErrorCode.pluginRuntimeClusterUnavailable, {
      message: `Coworkerd cluster gateway error (${status}): ${reason}`,
      data: { status, code, reason }
    });
  }

  // 7. General Invocation Failure (e.g. 500 EXECUTION_FAILED from worker handler)
  return createError(ErrorCode.pluginInvokeFailed, {
    message: `Coworkerd invoke failed: ${code} ${reason}`,
    data: { status, code, reason }
  });
}

/**
 * Maps Coworkerd API client errors (e.g. from /v1 management calls) to domain RegisteredError.
 */
export function mapCoworkerdApiError(error: unknown): RegisteredError {
  if (error instanceof RegisteredError) {
    return error;
  }

  if (isRecord(error)) {
    const code = typeof error.code === 'string' ? error.code.toUpperCase() : '';
    const status = isRecord(error.data) && typeof error.data.status === 'number' ? error.data.status : undefined;
    const message = typeof error.message === 'string' ? error.message : 'Coworkerd API error';

    if (code === 'LOAD_FAILED' || status === 422) {
      return createError(ErrorCode.pluginRuntimeTrialLoadFailed, {
        message: `Coworkerd trial load failed: ${message}`,
        data: error
      });
    }

    if (code === 'NOT_FOUND' || status === 404) {
      return createError(ErrorCode.pluginRuntimePluginNotFound, {
        message: `Coworkerd resource not found: ${message}`,
        data: error
      });
    }

    if (code === 'NETWORK_ERROR' || isNetworkError(error.error ?? error)) {
      return createError(ErrorCode.pluginRuntimeClusterUnavailable, {
        message: `Coworkerd cluster API unreachable: ${message}`,
        data: error
      });
    }
  }

  if (isNetworkError(error)) {
    return createError(ErrorCode.pluginRuntimeClusterUnavailable, {
      message: `Coworkerd cluster API unreachable: ${getErrorMessage(error)}`,
      cause: error
    });
  }

  return createError(ErrorCode.operationFailed, {
    message: getErrorMessage(error),
    cause: error
  });
}

/**
 * Maps any error or RegisteredError to a RuntimeFailureKind for telemetry metrics.
 */
export function mapErrorToFailureKind(error: unknown): RuntimeFailureKind {
  if (isRecord(error) && typeof error.code === 'string') {
    switch (error.code) {
      case ErrorCode.pluginInvokeCpuLimitExceeded:
        return 'cpu_limit_exceeded';
      case ErrorCode.pluginInvokeMemoryLimitExceeded:
        return 'memory_limit_exceeded';
      case ErrorCode.pluginRuntimeTrialLoadFailed:
        return 'trial_load_failed';
      case ErrorCode.pluginRuntimeClusterUnavailable:
        return error.telemetryKind === 'circuit_breaker_open' ? 'circuit_breaker_open' : 'cluster_unavailable';
      case ErrorCode.pluginInvokeTimeout:
        return 'queue_timeout'; // maps to timeout category
      default:
        break;
    }
  }

  if (isRecord(error)) {
    const code = typeof error.code === 'string' ? error.code.toUpperCase() : '';
    if (code.includes('CPU')) return 'cpu_limit_exceeded';
    if (code.includes('MEMORY')) return 'memory_limit_exceeded';
    if (code === 'LOAD_FAILED') return 'trial_load_failed';
  }

  return 'unknown';
}

/**
 * Determines whether an error represents a cluster-level infrastructure/transport failure.
 * Transport failures increment the circuit breaker failure count.
 * Application errors, worker handler exceptions, and resource quota limits DO NOT trip the breaker.
 */
export function isClusterTransportFailure(error: unknown, status?: number): boolean {
  if (status === 502 || status === 504) {
    return true;
  }

  if (status === 503) {
    if (isRecord(error)) {
      const code = typeof error.code === 'string' ? error.code.toUpperCase() : '';
      if (code.includes('CPU') || code.includes('MEMORY')) {
        return false; // Worker quota limit, cluster is healthy
      }
    }
    return true; // Generic 503 Service Unavailable is a cluster/node issue
  }

  if (isRecord(error) && typeof error.code === 'string') {
    if (error.code === ErrorCode.pluginRuntimeClusterUnavailable) {
      return true;
    }
    if (
      error.code === ErrorCode.pluginInvokeCpuLimitExceeded ||
      error.code === ErrorCode.pluginInvokeMemoryLimitExceeded ||
      error.code === ErrorCode.pluginRuntimeTrialLoadFailed ||
      error.code === ErrorCode.pluginRuntimePluginNotFound ||
      error.code === ErrorCode.pluginRuntimeEventNotSupported ||
      error.code === ErrorCode.pluginInvokeFailed
    ) {
      return false;
    }
  }

  if (isNetworkError(error)) {
    return true;
  }

  if (isRecord(error)) {
    if (error.code === 'NETWORK_ERROR') return true;
    if (isNetworkError(error.error)) return true;
  }

  return false;
}

function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof TypeError && error.message.includes('fetch failed')) return true;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    const code = (error as { code?: string }).code?.toUpperCase() ?? '';
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT' || code === 'ECONNRESET') return true;
    if (msg.includes('connection refused') || msg.includes('econnrefused') || msg.includes('socket hang up') || msg.includes('network error') || msg.includes('unreachable') || msg.includes('draining')) {
      return true;
    }
  }
  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? 'Unknown error');
}
