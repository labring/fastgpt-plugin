import { describe, expect, it } from 'vitest';
import z from 'zod';

import { createError } from '@domain/value-objects/error.vo';
import { failureResult } from '@domain/value-objects/result.vo';
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

    expect(response).toEqual({
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

  it('keeps legacy nested failures readable without duplicate object causes', () => {
    const [, pluginNotFound] = failureResult({
      en: 'Plugin not found',
      'zh-CN': '插件未找到'
    });
    const [, getPluginFailed] = failureResult(
      {
        en: 'Failed to get plugin by plugin id',
        'zh-CN': '获取插件失败'
      },
      pluginNotFound
    );

    if (!getPluginFailed) {
      throw new Error('Expected get plugin failure');
    }

    const response = R.fail(createContext(), 400, getPluginFailed.error);

    expect(response).toEqual({
      status: 400,
      body: {
        error: {
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
        }
      }
    });
  });

  it('returns readable validation errors with issue details', () => {
    const schema = z.object({
      pluginId: z.string()
    });
    const result = schema.safeParse({});

    if (result.success) {
      throw new Error('Expected validation failure');
    }

    const response = R.fail(createContext(), 400, result.error);

    expect(response).toMatchObject({
      status: 400,
      body: {
        error: {
          code: ErrorCode.validationFailed,
          message: expect.stringContaining('Validation failed: pluginId:'),
          reason: {
            en: expect.stringContaining('Validation failed: pluginId:'),
            'zh-CN': expect.stringContaining('请求参数校验失败: pluginId:')
          },
          data: {
            issues: [
              expect.objectContaining({
                path: 'pluginId',
                message: expect.any(String),
                code: expect.any(String)
              })
            ]
          }
        }
      }
    });
    expect(
      (response as unknown as { body: { error: Record<string, unknown> } }).body.error
    ).not.toHaveProperty('cause');
  });

  it('keeps validation type errors distinct from missing required fields', () => {
    const schema = z.object({
      pluginId: z.string()
    });
    const result = schema.safeParse({ pluginId: 1 });

    if (result.success) {
      throw new Error('Expected validation failure');
    }

    const response = R.fail(createContext(), 400, result.error);

    expect(response).toMatchObject({
      status: 400,
      body: {
        error: {
          code: ErrorCode.validationFailed,
          reason: {
            'zh-CN': expect.stringContaining('pluginId: 类型错误，应为 string')
          },
          data: {
            issues: [
              expect.objectContaining({
                path: 'pluginId',
                message: expect.stringContaining('received number')
              })
            ]
          }
        }
      }
    });
  });
});
