import z from 'zod';

import { SystemVarSchema } from './system-var.vo';
import { ToolStreamMessageSchema } from './tool.vo';

export const CONNECTION_GATEWAY_PLUGIN_DEBUG_CONSUMER_TYPE = 'plugin-debug';
export const CONNECTION_GATEWAY_PLUGIN_DEBUG_INVOKE_CAPABILITY = 'invoke';
export const CONNECTION_GATEWAY_BIND_CAPABILITY = 'gateway.bind';

export const ConnectionGatewayPluginDebugRequestPayloadSchema = z.object({
  kind: z.literal('plugin-debug.run'),
  eventName: z.literal('run'),
  payload: z.object({
    pluginId: z.string().min(1).optional(),
    input: z.record(z.string(), z.unknown()),
    secrets: z.record(z.string(), z.unknown()).optional(),
    systemVar: SystemVarSchema,
    source: z.string().optional(),
    childId: z.string().optional()
  })
});
export type ConnectionGatewayPluginDebugRequestPayload = z.infer<
  typeof ConnectionGatewayPluginDebugRequestPayloadSchema
>;

export const ConnectionGatewayPluginDebugResponsePayloadSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('plugin-debug.accepted')
  }),
  z.object({
    kind: z.literal('plugin-debug.error'),
    message: z.string(),
    code: z.string().optional(),
    data: z.unknown().optional()
  })
]);
export type ConnectionGatewayPluginDebugResponsePayload = z.infer<
  typeof ConnectionGatewayPluginDebugResponsePayloadSchema
>;

export const ConnectionGatewayPluginDebugStreamPayloadSchema = z.discriminatedUnion('event', [
  z.object({
    kind: z.literal('plugin-debug.stream'),
    event: z.literal('chunk'),
    data: ToolStreamMessageSchema
  }),
  z.object({
    kind: z.literal('plugin-debug.stream'),
    event: z.literal('end')
  }),
  z.object({
    kind: z.literal('plugin-debug.stream'),
    event: z.literal('error'),
    message: z.string()
  })
]);
export type ConnectionGatewayPluginDebugStreamPayload = z.infer<
  typeof ConnectionGatewayPluginDebugStreamPayloadSchema
>;
