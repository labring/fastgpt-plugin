import type { SystemVarType } from '@fastgpt-plugin/helpers/tools/schemas/req';
import { AsyncLocalStorage } from 'async_hooks';

export type ToolContext = {
  systemVar: SystemVarType;
  runId: string;
};

globalThis._toolContextStorage = new AsyncLocalStorage<ToolContext>();

declare global {
  var _toolContextStorage: AsyncLocalStorage<ToolContext>;
}

export const getCurrentToolPrefix = (): string | undefined => {
  const context = globalThis._toolContextStorage.getStore();

  return context?.systemVar.tool.prefix;
};

export const getToolRunId = (): string | undefined => {
  const context = globalThis._toolContextStorage.getStore();

  return context?.runId;
};

export const runWithToolContext = <T>(context: ToolContext, fn: () => T): T => {
  return globalThis._toolContextStorage.run(context, fn);
};
