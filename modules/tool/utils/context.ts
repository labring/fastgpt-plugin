import { AsyncLocalStorage } from 'async_hooks';

export type ToolContext = {
  prefix?: string;
};

globalThis._toolContextStorage = new AsyncLocalStorage<ToolContext>();

declare global {
  var _toolContextStorage: AsyncLocalStorage<ToolContext>;
}

export const getCurrentToolPrefix = (): string | undefined => {
  const context = globalThis._toolContextStorage.getStore();

  return context?.prefix;
};

export const runWithToolContext = <T>(context: ToolContext, fn: () => T): T => {
  return globalThis._toolContextStorage.run(context, fn);
};
