import { describe, expect, it } from 'vitest';

import {
  createError,
  createReasonError,
  deserializeError,
  getErrorDefinition,
  RegisteredError,
  registerErrors,
  serializeError,
  toErrorResponse
} from './error.vo';

const ErrorCode = {
  pluginRuntimeConfigLoadFailed: 'test.error.runtime_config_load_failed',
  pluginInvokeTimeout: 'test.error.invoke_timeout',
  internalServerError: 'test.error.internal_server_error'
} as const;

if (!getErrorDefinition(ErrorCode.pluginRuntimeConfigLoadFailed)) {
  registerErrors([
    {
      code: ErrorCode.pluginRuntimeConfigLoadFailed,
      message: 'Failed to get plugin runtime config',
      reason: { en: 'Failed to get plugin runtime config', 'zh-CN': '获取插件运行时配置失败' }
    },
    {
      code: ErrorCode.pluginInvokeTimeout,
      message: 'Plugin invocation timed out',
      reason: { en: 'Plugin invocation timed out', 'zh-CN': '插件调用超时' },
      httpStatus: 504
    },
    {
      code: ErrorCode.internalServerError,
      message: 'Internal Server Error',
      reason: { en: 'Internal Server Error', 'zh-CN': '服务器内部错误' },
      httpStatus: 500,
      visibility: 'internal',
      severity: 'unexpected'
    }
  ]);
}

describe('RegisteredError', () => {
  it('preserves registered metadata and native cause', () => {
    const cause = new Error('database offline');
    const error = createError(ErrorCode.pluginRuntimeConfigLoadFailed, { cause });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(RegisteredError);
    expect(error.code).toBe(ErrorCode.pluginRuntimeConfigLoadFailed);
    expect(error.reason.en).toBe('Failed to get plugin runtime config');
    expect(error.cause).toBe(cause);
  });

  it('serializes and deserializes nested causes', () => {
    const cause = Object.assign(new Error('Request timeout: run'), {
      code: 'REQUEST_TIMEOUT',
      data: { timeoutMs: 1000 }
    });
    const error = createError(ErrorCode.pluginInvokeTimeout, {
      cause,
      data: { method: 'run' }
    });

    const restored = deserializeError(serializeError(error));

    expect(restored).toBeInstanceOf(RegisteredError);
    expect((restored as RegisteredError).code).toBe(ErrorCode.pluginInvokeTimeout);
    expect((restored as RegisteredError).data).toEqual({ method: 'run' });
    expect(restored.cause).toBeInstanceOf(Error);
    expect((restored.cause as Error & { code?: string }).code).toBe('REQUEST_TIMEOUT');
  });

  it('redacts internal registered errors in HTTP responses', () => {
    const cause = new Error('Mongo connection string leaked here');
    const response = toErrorResponse(
      createError(ErrorCode.internalServerError, {
        message: 'Mongo connection string leaked here',
        cause
      })
    );

    expect(response).toMatchObject({
      code: ErrorCode.internalServerError,
      message: 'Internal Server Error',
      reason: {
        en: 'Internal Server Error',
        'zh-CN': '服务器内部错误'
      }
    });
    expect(response.cause?.message).toBe('Mongo connection string leaked here');
  });

  it('serializes legacy reason errors without duplicating reason causes', () => {
    const pluginNotFound = createReasonError({
      en: 'Plugin not found',
      'zh-CN': '插件未找到'
    });
    const getPluginFailed = createReasonError(
      {
        en: 'Failed to get plugin by plugin id',
        'zh-CN': '获取插件失败'
      },
      { cause: pluginNotFound }
    );

    expect(toErrorResponse(getPluginFailed)).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Failed to get plugin by plugin id',
      reason: {
        en: 'Failed to get plugin by plugin id',
        'zh-CN': '获取插件失败'
      },
      cause: {
        code: 'INTERNAL_ERROR',
        message: 'Plugin not found',
        reason: {
          en: 'Plugin not found',
          'zh-CN': '插件未找到'
        }
      }
    });
  });

  it('deserializes legacy reason errors without losing reason metadata', () => {
    const reason = {
      en: 'Plugin not found',
      'zh-CN': '插件未找到'
    };

    const restored = deserializeError(serializeError(createReasonError(reason)));

    expect(restored.message).toBe(reason.en);
    expect((restored as Error & { reason?: unknown }).reason).toEqual(reason);
    expect(toErrorResponse(restored)).toMatchObject({
      message: reason.en,
      reason
    });
  });
});
