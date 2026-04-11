import z from 'zod';

export const TransportSchema = z.enum(['ipc']);
export const TransportTypeEnum = TransportSchema.enum;
export type TransportType = z.infer<typeof TransportSchema>;

export const PluginMessageTypeSchema = z.enum(['request', 'response', 'event', 'ready', 'error']);
export const PluginMessageTypeEnum = PluginMessageTypeSchema.enum;
export type PluginMessageType = z.infer<typeof PluginMessageTypeSchema>;

export const PluginMessageErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  stack: z.string().optional()
});

export type PluginMessageErrorType = z.infer<typeof PluginMessageErrorSchema>;

export const PluginMessageSchema = z.object({
  id: z.string(),
  messageType: PluginMessageTypeSchema,
  method: z.string().optional(),
  params: z.any().optional(),
  result: z.any().optional(),
  error: PluginMessageErrorSchema.optional(),
  traceId: z.string().optional(),
  timestamp: z.number()
});

export type PluginIOMessage = z.infer<typeof PluginMessageSchema>;

export type PendingEntry = {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};
/**
 * Plugin 通信架构
 *
 * PluginService => PluginRouter
 */

/**
 * Plugin Transport (底层)
 * Plugin 通信的底层设计，
 */
export interface PluginTransportPort {
  readonly transportType: TransportType;

  send(message: PluginIOMessage): Promise<void>;
  /** 注册消息处理器，返回取消订阅函数 */
  onMessage(handler: (message: PluginIOMessage) => void): () => void;
  close(): Promise<void>;
}
