import { AsyncLocalStorage } from 'node:async_hooks';
import type { Config as LogTapeConfig } from '@logtape/logtape';
import {
  configure,
  dispose,
  getConsoleSink,
  getLogger as getLogTapeLogger,
  getConfig as getLogTapeConfig
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

  const isDevelopmentNodeEnv = env.NODE_ENV === 'development';
  const enableConsole = env.LOG_ENABLE_CONSOLE;
  const enableOtel = env.LOG_ENABLE_OTEL;
  const otelServiceName = env.LOG_OTEL_SERVICE_NAME;
  const otelUrl = env.LOG_OTEL_URL;

  const sinkConfig = {
    bufferSize: 8192,
    flushInterval: 5000,
    nonBlocking: true,
    lazy: true
  } as const;

  const sinks: Config<string>['sinks'] = {};
  const composedSinks: SinkId[] = [];

  if (enableConsole) {
    sinks.console = getConsoleSink({
      ...sinkConfig,
      formatter: getPrettyFormatter({
        icons: false,
        level: 'ABBR',
        wordWrap: false,
        levelStyle: 'reset',
        messageStyle: 'reset',
        categoryStyle: 'reset',
        messageColor: 'white',
        categoryColor: 'white',
        categorySeparator: ':',
        timestamp: () => dayjs().format('YYYY-MM-DD HH:mm:ss')
      })
    });
    composedSinks.push('console');
    console.log('✓ Logtape console sink enabled');
  }

  if (enableOtel) {
    sinks.otel = getOpenTelemetrySink({
      serviceName: otelServiceName,
      otlpExporterConfig: {
        url: otelUrl
      }
    });
    composedSinks.push('otel');
    console.log(`✓ Logtape OpenTelemetry URL: ${otelUrl}`);
    console.log(`✓ Logtape OpenTelemetry service name: ${otelServiceName}`);
    console.log('✓ Logtape OpenTelemetry enabled');
  }

  const loggers: Config['loggers'] = [
    {
      category: ['logtape', 'meta'],
      lowestLevel: 'error',
      sinks: []
    },
    {
      category: ['app'],
      lowestLevel: isDevelopmentNodeEnv ? 'debug' : 'info',
      sinks: composedSinks
    },
    {
      category: ['error'],
      lowestLevel: isDevelopmentNodeEnv ? 'debug' : 'error',
      sinks: composedSinks
    },
    {
      category: ['http'],
      lowestLevel: isDevelopmentNodeEnv ? 'debug' : 'info',
      sinks: composedSinks
    },
    {
      category: ['middleware'],
      lowestLevel: isDevelopmentNodeEnv ? 'debug' : 'info',
      sinks: composedSinks
    },
    {
      category: ['infra'],
      lowestLevel: isDevelopmentNodeEnv ? 'debug' : 'info',
      sinks: composedSinks
    },
    {
      category: ['mod'],
      lowestLevel: isDevelopmentNodeEnv ? 'debug' : 'info',
      sinks: composedSinks
    }
  ];

  console.log('✓ Logtape has enabled sinks:', composedSinks);

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
