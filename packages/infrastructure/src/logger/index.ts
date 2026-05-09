import { AsyncLocalStorage } from 'node:async_hooks';

import {
  configureLogger as configureOtelLogger,
  disposeLogger,
  getLogger as getOtelLogger,
  type LoggerConfig,
  type LoggerSinkId,
  withContext
} from '@fastgpt-sdk/otel/logger';

import { env } from '../env';

import type { LogCategory } from './categories';

type LogLevel = 'trace' | 'debug' | 'info' | 'warning' | 'error' | 'fatal';
export type Logger = ReturnType<typeof getOtelLogger>;

const contextLocalStorage = new AsyncLocalStorage<Record<string, unknown>>();

let configured = false;
export async function configureLogger() {
  if (configured) {
    return;
  }

  const enableConsole = env.LOG_ENABLE_CONSOLE;
  const consoleLevel = env.LOG_CONSOLE_LEVEL;
  const enableOtel = env.LOG_ENABLE_OTEL;
  const otelServiceName = env.LOG_OTEL_SERVICE_NAME;
  const otelUrl = env.LOG_OTEL_URL;
  const otelLevel = env.LOG_OTEL_LEVEL;

  let otelSinkEnabled = false;

  // 日志级别顺序（从低到高）
  const levelOrder: LogLevel[] = ['trace', 'debug', 'info', 'warning', 'error', 'fatal'];
  const getLowestLevel = (level1: LogLevel, level2: LogLevel): LogLevel => {
    const index1 = levelOrder.indexOf(level1);
    const index2 = levelOrder.indexOf(level2);
    return index1 < index2 ? level1 : level2;
  };

  // 计算最低级别（两个 sink 中较低的那个）
  let lowestLevel: LogLevel = consoleLevel;
  if (enableConsole && enableOtel) {
    lowestLevel = getLowestLevel(consoleLevel, otelLevel);
  } else if (enableOtel) {
    lowestLevel = otelLevel;
  }

  const composedSinks: LoggerSinkId[] = [];

  if (enableConsole) {
    composedSinks.push('console');
    console.log('✓ Logtape console sink enabled');
  }

  if (enableOtel) {
    composedSinks.push('otel');
    otelSinkEnabled = true;
    console.log(`✓ Logtape OpenTelemetry URL: ${otelUrl}`);
    console.log(`✓ Logtape OpenTelemetry service name: ${otelServiceName}`);
    console.log(`✓ Logtape OpenTelemetry level: ${otelLevel}`);
    console.log('✓ Logtape OpenTelemetry enabled');
  }

  const categories = ['app', 'error', 'http', 'middleware', 'infra', 'mod'];
  const loggers: LoggerConfig = [
    {
      category: ['logtape', 'meta'],
      sinks: []
    }
  ];

  // 为每个 category 创建配置
  for (const category of categories) {
    loggers.push({
      category: [category],
      sinks: composedSinks,
      lowestLevel: lowestLevel
    });
  }

  const enabledSinks = [];
  if (enableConsole) enabledSinks.push(`console(${consoleLevel})`);
  if (otelSinkEnabled) enabledSinks.push(`otel(${otelLevel})`);
  console.log('✓ Logtape has enabled sinks:', enabledSinks.join(', '));

  await configureOtelLogger({
    console: {
      enabled: enableConsole,
      level: consoleLevel
    },
    otel: enableOtel
      ? {
          enabled: true,
          level: otelLevel,
          serviceName: otelServiceName,
          url: otelUrl
        }
      : false,
    loggers,
    contextLocalStorage,
    defaultCategory: ['app']
  });

  configured = true;
}

export function getLogger(category: LogCategory) {
  return getOtelLogger(category);
}

export async function destroyLogger() {
  if (configured) {
    await disposeLogger();
    configured = false;
  }
}

export { withContext };

export function getContext(): Record<string, unknown> | undefined {
  return contextLocalStorage.getStore();
}
export type { LogCategory } from './categories';
export { http, infra, middleware, mod, root } from './categories';
