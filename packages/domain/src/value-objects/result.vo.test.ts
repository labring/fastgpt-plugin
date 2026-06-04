import { describe, expect, it } from 'vitest';

import { createError, getErrorDefinition, registerErrors } from './error.vo';
import { failureResult } from './result.vo';

const ErrorCode = {
  pluginInvokeFailed: 'test.result.plugin_invoke_failed'
} as const;

if (!getErrorDefinition(ErrorCode.pluginInvokeFailed)) {
  registerErrors([
    {
      code: ErrorCode.pluginInvokeFailed,
      message: 'Invoke failed',
      reason: { en: 'Invoke failed', 'zh-CN': '调用失败' }
    }
  ]);
}

describe('failureResult', () => {
  it('keeps Error instances as the failure error', () => {
    const cause = new Error('raw failure');
    const error = createError(ErrorCode.pluginInvokeFailed, { cause });
    const [, failure] = failureResult(error);

    expect(failure?.error).toBe(error);
    expect(failure?.error.cause).toBe(cause);
    expect(failure?.reason).toEqual(error.reason);
  });

  it('wraps legacy i18n failures in native Error', () => {
    const reason = { en: 'legacy failure', 'zh-CN': '旧失败' };
    const [, failure] = failureResult(reason);

    expect(failure?.error).toBeInstanceOf(Error);
    expect(failure?.error.message).toBe(reason.en);
    expect(failure?.error.cause).toBe(reason);
    expect(failure?.reason).toBe(reason);
  });

  it('keeps legacy failure cause details in the native Error message', () => {
    const reason = { en: 'legacy failure', 'zh-CN': '旧失败' };
    const cause = new Error('database offline');
    const [, failure] = failureResult(reason, cause);

    expect(failure?.error).toBeInstanceOf(Error);
    expect(failure?.error.message).toBe('旧失败: database offline');
    expect(failure?.error.cause).toBe(cause);
    expect(failure?.reason).toBe(reason);
  });
});
