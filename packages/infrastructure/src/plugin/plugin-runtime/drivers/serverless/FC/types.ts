import type { Mutex } from 'es-toolkit';
import z from 'zod';

import type { PluginType } from '@domain/entities/plugin.entity';
import type { InvokePort } from '@domain/ports/invoke.port';
import type { PluginInvokeEventNameType } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { PluginUniqueIdType } from '@domain/value-objects/plugin.vo';
import type { ToolStreamMessageType } from '@domain/value-objects/tool.vo';

export const FCInvocationModeSchema = z.enum(['http-stream', 'openapi-buffered']);
export type FCInvocationModeType = z.infer<typeof FCInvocationModeSchema>;

export const FCPluginConfigSchema = z.object({
  minInstances: z.number().int().nonnegative(),
  maxConcurrency: z.number().int().positive(),
  timeoutMs: z.number().int().positive(),
  memorySize: z.number().int().positive(),
  diskSize: z.number().int().positive().default(512),
  cpu: z.number().positive(),
  reservedConcurrency: z.number().int().nonnegative().optional(),
  provisionedConcurrency: z.number().int().nonnegative().optional(),
  maxQueueSize: z.number().int().positive(),
  queueTimeoutMs: z.number().int().nonnegative(),
  invocationMode: FCInvocationModeSchema
});

export type FCPluginConfigType = z.infer<typeof FCPluginConfigSchema>;

export type FCFunctionState = 'created' | 'updated' | 'unchanged';

export type FCArtifactInfo = {
  bucket: string;
  key: string;
  etag?: string;
  size?: number;
  existed: boolean;
};

export type FCFunctionDefinition = {
  uniqueId: PluginUniqueIdType;
  runtimeId: string;
  functionName: string;
  image: string;
  roleArn: string;
  artifact: Pick<FCArtifactInfo, 'bucket' | 'key' | 'etag' | 'size'>;
  config: FCPluginConfigType;
  env: Record<string, string>;
};

export type FCFunctionRecord = FCFunctionDefinition & {
  updatedAt: number;
  state?: string;
};

export type FCFunctionEnsureResult = {
  state: FCFunctionState;
  function: FCFunctionRecord;
};

export type FCInvokeFrame =
  | {
      type: 'stream';
      data: ToolStreamMessageType['data'];
    }
  | {
      type: 'response';
      data: unknown;
    }
  | {
      type: 'error';
      data: string | { code?: string; message?: string; invocationId?: string };
    };

export type FCFunctionInvokeInput<P = unknown> = {
  runtimeId: string;
  functionName: string;
  invocationId: string;
  eventName: PluginInvokeEventNameType;
  payload: P;
  returnStream: boolean;
  timeoutMs: number;
  invocationMode: FCInvocationModeType;
};

export type FCFunctionInvokeResult<R = unknown> = {
  response?: R;
  frames?: FCInvokeFrame[];
};

export type FCManagerMetrics = {
  activeInvocations: number;
  totalRequests: number;
  totalErrors: number;
  totalFunctions: number;
  functions: Record<string, FCPluginStatus>;
};

export type FCPluginStatus = {
  runtimeId: string;
  functionName: string;
  config: FCPluginConfigType;
  meta: Pick<PluginType, 'pluginId' | 'version' | 'etag' | 'type'>;
  artifact: Pick<FCArtifactInfo, 'bucket' | 'key' | 'etag' | 'size'>;
  totalRequests: number;
  totalErrors: number;
  activeInvocations: number;
  updatedAt: number;
  functionState?: string;
};

export type FCPluginItemType = {
  runtimeId: string;
  functionName: string;
  config: FCPluginConfigType;
  meta: PluginType;
  artifact: FCArtifactInfo;
  mutex: Mutex;
  updatedAt: number;
  functionState?: string;
  metrics: {
    totalRequests: number;
    totalErrors: number;
    activeInvocations: number;
  };
  invokeSessions: Map<string, InvokePort>;
};

export type FCRuntimeErrorCode =
  | 'FC_CONFIG_INVALID'
  | 'FC_ARTIFACT_NOT_FOUND'
  | 'FC_ARTIFACT_UPLOAD_FAILED'
  | 'FC_FUNCTION_ENSURE_FAILED'
  | 'FC_FUNCTION_NOT_FOUND'
  | 'FC_INVOKE_UNAUTHORIZED'
  | 'FC_INVOKE_TIMEOUT'
  | 'FC_INVOKE_NETWORK_ERROR'
  | 'FC_STREAM_PROTOCOL_ERROR'
  | 'FC_HANDLER_ERROR';

export class FCRuntimeError extends Error {
  constructor(
    public readonly code: FCRuntimeErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'FCRuntimeError';
  }
}

export interface FCFunctionProvider {
  getFunction(functionName: string): Promise<FCFunctionRecord | null>;
  ensureFunction(definition: FCFunctionDefinition): Promise<FCFunctionEnsureResult>;
  deleteFunction(functionName: string): Promise<void>;
  invoke<P = unknown, R = unknown>(
    input: FCFunctionInvokeInput<P>
  ): Promise<FCFunctionInvokeResult<R>>;
}
