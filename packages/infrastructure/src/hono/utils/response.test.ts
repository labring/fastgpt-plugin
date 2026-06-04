import { describe, expect, it } from 'vitest';

import { createError } from '@domain/value-objects/error.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

import { R } from './response';

function createContext() {
  return {
    json: (body: unknown, status: number) => ({ body, status }),
    body: (body: unknown, status: number) => ({ body, status })
  } as unknown as Parameters<typeof R.fail>[0];
}

describe('R.fail', () => {
  it('returns registered ErrorResponse bodies', () => {
    const cause = new Error('Queue wait timeout');
    const response = R.fail(
      createContext(),
      503,
      createError(ErrorCode.pluginInvokeQueueTimeout, {
        cause,
        data: { timeoutMs: 20_000 }
      })
    );

    expect(response).toMatchObject({
      status: 503,
      body: {
        error: {
          code: ErrorCode.pluginInvokeQueueTimeout,
          message: 'Plugin invocation waited too long for an available local-pool pod',
          reason: {
            en: 'Plugin invocation waited too long for an available local-pool pod',
            'zh-CN': '插件调用等待空闲本地运行实例超时'
          },
          data: { timeoutMs: 20_000 },
          cause: {
            code: 'INTERNAL_ERROR',
            message: 'Queue wait timeout'
          }
        }
      }
    });
  });

  it('wraps legacy i18n response errors in the new HTTP error shape', () => {
    const response = R.fail(createContext(), 400, {
      en: 'file is required',
      'zh-CN': '没有上传文件'
    });

    expect(response).toMatchObject({
      status: 400,
      body: {
        error: {
          code: ErrorCode.badRequest,
          message: 'file is required',
          reason: {
            en: 'file is required',
            'zh-CN': '没有上传文件'
          }
        }
      }
    });
  });
});
