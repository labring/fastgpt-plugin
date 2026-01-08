import { AsyncLocalStorage } from 'async_hooks';

export type ToolContext = {
  prefix?: string;
};

export const toolContextStorage = new AsyncLocalStorage<ToolContext>();

export const getCurrentToolPrefix = (): string | undefined => {
  const context = toolContextStorage.getStore();
  if (context?.prefix) {
    return context.prefix;
  }

  return global.currentToolPrefix;
};

export const runWithToolContext = <T>(context: ToolContext, fn: () => T): T => {
  return toolContextStorage.run(context, fn);
};
