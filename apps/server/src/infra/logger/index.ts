import { AsyncLocalStorage } from 'node:async_hooks';
import type { Config as LogTapeConfig } from '@logtape/logtape';
import {
  configure,
  dispose,
  getConsoleSink,
  getLogger as getLogTapeLogger,
  getConfig as getLogTapeConfig,
  withFilter,
  getLevelFilter,
  type LogLevel
} from '@logtape/logtape';
import { getOpenTelemetrySink } from '@logtape/otel';
import { getPrettyFormatter } from '@logtape/pretty';
import dayjs from 'dayjs';
import type { LogCategory } from './categories';
import { env } from '@/env';

type SinkId = 'console' | 'jsonl' | 'otel';

type FilterId = string;

type Config<S extends string = SinkId, F extends string = FilterId> = LogTapeConfig<S, F>;

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

  const sinkConfig = {
    bufferSize: 8192,
    flushInterval: 5000,
    nonBlocking: true,
    lazy: true
  } as const;

  const sinks: Config<string>['sinks'] = {};
  const composedSinks: SinkId[] = [];

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

  if (enableConsole) {
    const consoleSink = getConsoleSink({
      ...sinkConfig,
      formatter: getPrettyFormatter({
        icons: false,
        level: 'ABBR',
        wordWrap: false,
        categorySeparator: ':',
        messageColor: null,
        categoryColor: null,
        timestampColor: null,
        levelStyle: 'reset',
        messageStyle: 'reset',
        categoryStyle: 'reset',
        timestampStyle: 'reset',
        timestamp: (ts) => dayjs(ts).format('YYYY-MM-DD HH:mm:ss'),
        properties: true // 显示结构化数据
      })
    });
    // 如果 console level 比 lowestLevel 高，添加 filter
    sinks.console =
      consoleLevel !== lowestLevel
        ? withFilter(consoleSink, getLevelFilter(consoleLevel))
        : consoleSink;
    composedSinks.push('console');
    console.log('✓ Logtape console sink enabled');
  }

  if (enableOtel) {
    const otelSink = getOpenTelemetrySink({
      serviceName: otelServiceName,
      otlpExporterConfig: {
        url: otelUrl
      }
    });
    // 如果 otel level 比 lowestLevel 高，添加 filter
    sinks.otel =
      otelLevel !== lowestLevel ? withFilter(otelSink, getLevelFilter(otelLevel)) : otelSink;
    composedSinks.push('otel');
    console.log(`✓ Logtape OpenTelemetry URL: ${otelUrl}`);
    console.log(`✓ Logtape OpenTelemetry service name: ${otelServiceName}`);
    console.log(`✓ Logtape OpenTelemetry level: ${otelLevel}`);
    console.log('✓ Logtape OpenTelemetry enabled');
  }

  const categories = ['app', 'error', 'http', 'middleware', 'infra', 'mod'];
  const loggers: Config['loggers'] = [
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
  if (enableOtel) enabledSinks.push(`otel(${otelLevel})`);
  console.log('✓ Logtape has enabled sinks:', enabledSinks.join(', '));

  await configure({
    sinks: sinks,
    loggers: loggers,
    contextLocalStorage: new AsyncLocalStorage()
  });

  configured = true;
}

export function getLogger(category: LogCategory) {
  return getLogTapeLogger(category);
}

export async function destroyLogger() {
  if (configured) {
    await dispose();
    configured = false;
  }
}

export { type Logger, withContext, getConfig } from '@logtape/logtape';

export function getContext(): Record<string, unknown> | undefined {
  const config = getLogTapeConfig();
  return config?.contextLocalStorage?.getStore();
}
export type { LogCategory } from './categories';
export { root, http, middleware, mod, infra } from './categories';
