import type { SystemVarType } from '@tool/type/req';

type InvokeHandler<TParams = any, TResult = any> = (
  params: TParams,
  systemVar: SystemVarType
) => Promise<TResult>;

const invokeHandlers = new Map<string, InvokeHandler>();

export function registerInvokeHandler<TParams, TResult>(
  method: string,
  handler: InvokeHandler<TParams, TResult>
) {
  if (invokeHandlers.has(method)) {
    console.warn(`Invoke handler for method "${method}" is being overwritten`);
  }
  invokeHandlers.set(method, handler);
}

export function getInvokeHandler(method: string): InvokeHandler | undefined {
  return invokeHandlers.get(method);
}

export function hasInvokeHandler(method: string): boolean {
  return invokeHandlers.has(method);
}

export function getAllRegisteredMethods(): string[] {
  return Array.from(invokeHandlers.keys());
}
