import { randomUUID } from 'node:crypto';

import type { PluginRuntimeInvokeOptions } from '@domain/ports/plugin/plugin-runtime-manager.port';
import { createError, getErrorDefinition, type RegisteredError } from '@domain/value-objects/error.vo';
import type { PluginSourceType } from '@domain/value-objects/plugin.vo';
import {
  isPluginDebugSource,
  parsePluginDebugSessionSource
} from '@domain/value-objects/plugin-debug-session.vo';
import type { SystemVarType } from '@domain/value-objects/system-var.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

import { InvokeManager } from '../invoke/invoke.impl';

/** 从 debug source 中解析出调试身份；source 不含身份时抛错 */
export function getDebugIdentityFromSource(source: string): { tmbId?: string; userId?: string } {
  const debugSessionSource = parsePluginDebugSessionSource(source);
  if (debugSessionSource) {
    return debugSessionSource;
  }

  const parts = source.split(':');
  const userIndex = parts.indexOf('user');
  const userId = userIndex >= 0 ? parts[userIndex + 1] : undefined;
  if (userId) {
    return { userId };
  }

  throw createError(ErrorCode.pluginRuntimePluginNotFound, {
    message: 'Debug source must include tmbId or user id',
    data: { source }
  });
}

/** 构造 invoke 选项：注入 ctx.invoke 使用的 InvokeManager，debug source 时附调试身份 */
export function createPluginInvokeOptions({
  systemVar,
  source,
  fastgptBaseUrl
}: {
  systemVar: SystemVarType;
  source: PluginSourceType | undefined;
  fastgptBaseUrl: string;
}): PluginRuntimeInvokeOptions {
  const token = systemVar.invokeToken;
  return {
    invocationId: randomUUID(),
    invoke: new InvokeManager({
      token: typeof token === 'string' ? token : '',
      fastgptBaseUrl
    }),
    ...(isPluginDebugSource(source)
      ? {
          debug: {
            ...getDebugIdentityFromSource(source),
            source
          }
        }
      : {})
  };
}

/** 把 invoke 层错误统一映射成带调用上下文的 RegisteredError */
export function toPluginInvokeError(
  error: Error,
  context: Record<string, unknown>
): RegisteredError {
  if (isRegisteredError(error)) {
    return createError(error.code, {
      message: error.message,
      reason: error.reason,
      cause: error.cause ?? error,
      data: {
        ...(error.data ?? {}),
        ...context
      }
    });
  }

  return createError(ErrorCode.pluginInvokeFailed, {
    message: error.message,
    reason: {
      en: `Invoke failed: ${error.message}`,
      'zh-CN': `调用失败：${error.message}`
    },
    cause: error,
    data: context
  });
}

function isRegisteredError(error: Error): error is RegisteredError {
  const code = (error as Partial<RegisteredError>).code;
  return (
    typeof code === 'string' &&
    getErrorDefinition(code) !== undefined &&
    typeof (error as Partial<RegisteredError>).reason === 'object'
  );
}
