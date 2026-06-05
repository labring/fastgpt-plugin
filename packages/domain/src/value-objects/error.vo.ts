import type { I18nStringType } from './i18n-string.vo';

export type ErrorVisibility = 'public' | 'internal';
export type ErrorSeverity = 'expected' | 'unexpected';

export type ErrorDefinition = {
  code: string;
  message: string;
  reason: I18nStringType;
  httpStatus?: number;
  telemetryKind?: string;
  visibility?: ErrorVisibility;
  severity?: ErrorSeverity;
};

export type ErrorCode = ErrorDefinition['code'];

export type CreateErrorOptions = {
  message?: string;
  reason?: I18nStringType;
  cause?: unknown;
  data?: Record<string, unknown>;
};

export type SerializedError = {
  code?: string;
  name: string;
  message: string;
  reason?: I18nStringType;
  httpStatus?: number;
  telemetryKind?: string;
  visibility?: ErrorVisibility;
  data?: unknown;
  stack?: string;
  cause?: SerializedError;
};

export type ErrorResponseType = {
  code: string;
  message: string;
  reason: I18nStringType;
  data?: unknown;
  cause?: ErrorResponseType;
};

export type ReasonError = Error & {
  reason: I18nStringType;
};

const DEFAULT_INTERNAL_REASON: I18nStringType = {
  en: 'Internal Server Error',
  'zh-CN': '服务器内部错误'
};

const registry = new Map<string, ErrorDefinition>();

export class RegisteredError extends Error {
  readonly code: string;
  readonly reason: I18nStringType;
  readonly httpStatus: number;
  readonly telemetryKind?: string;
  readonly visibility: ErrorVisibility;
  readonly severity: ErrorSeverity;
  readonly data?: Record<string, unknown>;

  constructor(definition: ErrorDefinition, options: CreateErrorOptions = {}) {
    super(options.message ?? definition.message, {
      cause: normalizeErrorCause(options.cause)
    });
    this.name = 'RegisteredError';
    this.code = definition.code;
    this.reason = options.reason ?? definition.reason;
    this.httpStatus = definition.httpStatus ?? 500;
    this.telemetryKind = definition.telemetryKind;
    this.visibility = definition.visibility ?? 'public';
    this.severity = definition.severity ?? 'expected';
    this.data = options.data;
  }
}

export function registerErrors(definitions: ErrorDefinition[]): void {
  for (const definition of definitions) {
    const existing = registry.get(definition.code);
    if (existing) {
      throw new Error(`Error definition already registered: ${definition.code}`);
    }
    registry.set(definition.code, definition);
  }
}

export function getErrorDefinition(code: string): ErrorDefinition | undefined {
  return registry.get(code);
}

export function createError(code: string, options: CreateErrorOptions = {}): RegisteredError {
  const definition = registry.get(code);
  if (!definition) {
    throw new Error(`Error definition not registered: ${code}`);
  }

  return new RegisteredError(definition, options);
}

export function createReasonError(
  reason: I18nStringType,
  options: { cause?: unknown } = {}
): ReasonError {
  const cause = normalizeErrorCause(options.cause);
  const error = cause === undefined ? new Error(reason.en) : new Error(reason.en, { cause });

  return Object.assign(error, { reason });
}

export function normalizeToError(error: unknown, fallbackMessage = 'Unknown error'): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  if (isI18nString(error)) {
    return createReasonError(error);
  }

  if (isResultFailureLike(error)) {
    const reason = isI18nString(error.reason) ? error.reason : undefined;
    const cause = normalizeToError(error.error, reason?.en ?? fallbackMessage);
    if (reason && isSameI18nString(reason, getErrorReason(cause))) {
      return cause;
    }
    return reason ? createReasonError(reason, { cause }) : new Error(fallbackMessage, { cause });
  }

  return new Error(getUnknownErrorMessage(error, fallbackMessage), { cause: error });
}

export function getErrorReason(error: unknown, fallback?: I18nStringType): I18nStringType {
  if (error instanceof RegisteredError) {
    return error.visibility === 'internal' ? DEFAULT_INTERNAL_REASON : error.reason;
  }

  if (isI18nString(error)) {
    return error;
  }

  const record = isRecord(error) ? error : undefined;
  if (record && isI18nString(record.reason)) {
    return record.reason;
  }

  if (record && isI18nString(record.error)) {
    return record.error;
  }

  if (fallback) {
    return fallback;
  }

  if (error instanceof Error) {
    return {
      en: error.message,
      'zh-CN': error.message
    };
  }

  if (typeof error === 'string') {
    return {
      en: error,
      'zh-CN': error
    };
  }

  return DEFAULT_INTERNAL_REASON;
}

export function toErrorResponse(error: unknown): ErrorResponseType {
  const normalizedError = normalizeToError(error);
  const serialized = serializeError(normalizedError);
  const reason = getErrorReason(normalizedError);
  const code = serialized.code ?? 'INTERNAL_ERROR';

  return {
    code,
    message: normalizedError instanceof RegisteredError && normalizedError.visibility === 'internal'
      ? reason.en
      : serialized.message,
    reason,
    ...(serialized.data !== undefined ? { data: serialized.data } : {}),
    ...(serialized.cause ? { cause: toCauseResponse(serialized.cause) } : {})
  };
}

export function serializeError(error: unknown, options?: { includeStack?: boolean }): SerializedError {
  return serializeErrorInner(error, {
    includeStack: options?.includeStack ?? false,
    depth: 0,
    seen: new WeakSet<object>()
  });
}

function toCauseResponse(error: SerializedError): ErrorResponseType {
  const reason = error.reason ?? {
    en: error.message,
    'zh-CN': error.message
  };

  return {
    code: error.code ?? 'INTERNAL_ERROR',
    message: error.message,
    reason,
    ...(error.data !== undefined ? { data: error.data } : {}),
    ...(error.cause ? { cause: toCauseResponse(error.cause) } : {})
  };
}

export function deserializeError(error: SerializedError): Error {
  const cause = error.cause ? deserializeError(error.cause) : undefined;
  const definition = error.code ? getErrorDefinition(error.code) : undefined;

  if (definition) {
    const registeredError = new RegisteredError(definition, {
      message: error.message,
      reason: error.reason,
      cause,
      data: isRecord(error.data) ? error.data : undefined
    });
    if (error.stack) {
      registeredError.stack = error.stack;
    }
    return registeredError;
  }

  const result = new Error(error.message, { cause });
  result.name = error.name || 'Error';
  if (error.stack) {
    result.stack = error.stack;
  }

  return Object.assign(result, {
    ...(error.code !== undefined ? { code: error.code } : {}),
    ...(error.reason !== undefined ? { reason: error.reason } : {}),
    ...(error.data !== undefined ? { data: error.data } : {})
  });
}

function normalizeErrorCause(cause: unknown): unknown {
  if (cause === undefined || cause instanceof Error) {
    return cause;
  }

  if (typeof cause === 'string') {
    return new Error(cause);
  }

  if (isI18nString(cause)) {
    return createReasonError(cause);
  }

  if (isResultFailureLike(cause)) {
    return normalizeToError(cause);
  }

  return cause;
}

function serializeErrorInner(
  error: unknown,
  state: {
    includeStack: boolean;
    depth: number;
    seen: WeakSet<object>;
  }
): SerializedError {
  if (state.depth > 5) {
    return {
      name: 'Error',
      message: 'Error cause depth exceeded'
    };
  }

  if (error instanceof RegisteredError) {
    return {
      name: error.name,
      code: error.code,
      message: error.message,
      reason: error.reason,
      httpStatus: error.httpStatus,
      telemetryKind: error.telemetryKind,
      visibility: error.visibility,
      data: error.data,
      ...(state.includeStack && error.stack !== undefined ? { stack: error.stack } : {}),
      ...(error.cause !== undefined
        ? { cause: serializeErrorInner(error.cause, nextSerializeState(state, error)) }
        : {})
    };
  }

  if (error instanceof Error) {
    const reason = getI18nStringField(error, 'reason');

    return {
      name: error.name,
      code: getStringField(error, 'code'),
      message: error.message,
      ...(reason !== undefined ? { reason } : {}),
      data: getUnknownField(error, 'data'),
      ...(state.includeStack && error.stack !== undefined ? { stack: error.stack } : {}),
      ...(error.cause !== undefined
        ? { cause: serializeErrorInner(error.cause, nextSerializeState(state, error)) }
        : {})
    };
  }

  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error
    };
  }

  return {
    name: 'Error',
    message: getUnknownErrorMessage(error, 'Unknown error')
  };
}

function nextSerializeState(
  state: {
    includeStack: boolean;
    depth: number;
    seen: WeakSet<object>;
  },
  error: Error
) {
  if (state.seen.has(error)) {
    return {
      ...state,
      depth: 6
    };
  }

  state.seen.add(error);
  return {
    ...state,
    depth: state.depth + 1
  };
}

function getUnknownErrorMessage(error: unknown, fallback: string): string {
  if (error === null || error === undefined) {
    return fallback;
  }

  if (isRecord(error)) {
    const message = error.message ?? error.msg;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  return String(error);
}

function getStringField(error: Error, field: string): string | undefined {
  const value = (error as unknown as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : undefined;
}

function getI18nStringField(error: Error, field: string): I18nStringType | undefined {
  const value = (error as unknown as Record<string, unknown>)[field];
  return isI18nString(value) ? value : undefined;
}

function getUnknownField(error: Error, field: string): unknown {
  return (error as unknown as Record<string, unknown>)[field];
}

function isI18nString(value: unknown): value is I18nStringType {
  return (
    isRecord(value) &&
    typeof value.en === 'string' &&
    (value['zh-CN'] === undefined || typeof value['zh-CN'] === 'string') &&
    (value['zh-Hant'] === undefined || typeof value['zh-Hant'] === 'string')
  );
}

function isSameI18nString(left: I18nStringType, right: I18nStringType): boolean {
  return (
    left.en === right.en &&
    left['zh-CN'] === right['zh-CN'] &&
    left['zh-Hant'] === right['zh-Hant']
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object');
}

function isResultFailureLike(
  value: unknown
): value is { reason?: unknown; error: unknown } {
  return isRecord(value) && 'error' in value && ('reason' in value || isRecord(value.error));
}
