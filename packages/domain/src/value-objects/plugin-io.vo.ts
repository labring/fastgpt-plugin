import z from 'zod';

// ------ 传输层（低层，单一总线）------

export const TransportTypeSchema = z.enum(['ipc', 'tcp', 'http']);
export const TransportTypeEnum = TransportTypeSchema.enum;
export type TransportType = z.infer<typeof TransportTypeSchema>;

export interface PluginIOContext {
  traceId?: string;
  transportType: TransportType;
}

export type PluginIOHandler<TParams = unknown, TResult = unknown> = (
  params: TParams,
  context: PluginIOContext
) => TResult | Promise<TResult>;
