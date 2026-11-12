import z from 'zod';

import { createError } from '@domain/value-objects/error.vo';
import type { PluginStreamMessageType } from '@domain/value-objects/plugin-stream.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import type { StreamData } from '@domain/value-objects/stream.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

/**
 * 把插件的输出流抽干成一个值。
 *
 * `ToolManager.run` 是流式透传给路由，而 moderation 这类 request/response 事件需要单值结果，
 * 因此这里是独立逻辑而非重复实现。约定：
 * - 只取最后一帧 `response`；
 * - `stream` 帧显式失败（该事件不支持流式输出，不能忽略后落到「插件没有返回结果」的误导诊断）；
 * - `error` 帧、迭代抛出、缺少 `response` 帧、结果不符合标准结构，一律框架级失败。
 */
export async function consumePluginResult<T>({
  stream,
  schema,
  context
}: {
  stream: StreamData<PluginStreamMessageType>;
  schema: z.ZodType<T>;
  context: Record<string, unknown>;
}): Promise<Result<T>> {
  let responseData: unknown;
  let hasResponse = false;

  try {
    for await (const message of stream.values()) {
      if (message.type === 'response') {
        responseData = message.data;
        hasResponse = true;
        continue;
      }

      if (message.type === 'stream') {
        return failureResult(
          createError(ErrorCode.pluginInvokeFailed, {
            message: 'Event does not support streaming output',
            reason: {
              en: 'This plugin event does not support streaming output',
              'zh-CN': '该插件事件不支持流式输出'
            },
            data: context
          })
        );
      }

      return failureResult(
        createError(ErrorCode.pluginInvokeFailed, {
          message: message.data,
          reason: {
            en: `Plugin returned an error: ${message.data}`,
            'zh-CN': `插件返回错误：${message.data}`
          },
          data: context
        })
      );
    }
  } catch (error) {
    return failureResult(
      createError(ErrorCode.pluginInvokeFailed, {
        message: error instanceof Error ? error.message : String(error),
        reason: {
          en: 'Plugin invoke stream failed',
          'zh-CN': '插件调用流出错'
        },
        cause: error,
        data: context
      })
    );
  }

  if (!hasResponse) {
    return failureResult(
      createError(ErrorCode.pluginInvokeFailed, {
        message: 'Plugin returned no result',
        reason: {
          en: 'Plugin returned no result',
          'zh-CN': '插件没有返回结果'
        },
        data: context
      })
    );
  }

  const parsed = schema.safeParse(responseData);
  if (!parsed.success) {
    return failureResult(
      createError(ErrorCode.pluginInvokeFailed, {
        message: 'Plugin returned data that does not match the standard structure',
        reason: {
          en: 'Plugin returned data that does not match the standard structure',
          'zh-CN': '插件返回结构不符合标准结构'
        },
        data: {
          ...context,
          issues: parsed.error.issues
        }
      })
    );
  }

  return successResult(parsed.data);
}
