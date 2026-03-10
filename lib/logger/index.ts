import { AsyncLocalStorage } from 'node:async_hooks';
import { env } from '@/env';
import {
  configureLogger as configureSdkLogger,
  createLoggerOptionsFromEnv,
  disposeLogger,
  getLogger as getSdkLogger,
  withContext
} from '@fastgpt-sdk/logger';
import type { LogCategory } from './categories';
import { root } from './categories';

type LoggerContext = Record<string, unknown>;

const contextLocalStorage = new AsyncLocalStorage<LoggerContext>();

let configured = false;

export async function configureLogger() {
  if (configured) return;

  const options = createLoggerOptionsFromEnv({
    env,
    defaultCategory: [...root],
    defaultServiceName: 'fastgpt-plugin',
    sensitiveProperties: ['fastgpt']
  });

  await configureSdkLogger({
    ...options,
    contextLocalStorage
  });

  configured = true;
}

export function getLogger(category: LogCategory) {
  return getSdkLogger([...category]);
}

export async function destroyLogger() {
  if (configured) {
    await disposeLogger();
    configured = false;
  }
}

export function getContext(): LoggerContext | undefined {
  return contextLocalStorage.getStore();
}

export { withContext };
export type { LogCategory } from './categories';
export { root, http, middleware, mod, infra } from './categories';
