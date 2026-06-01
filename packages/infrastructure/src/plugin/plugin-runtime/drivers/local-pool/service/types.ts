import type { InvokePort } from '@domain/ports/invoke.port';
import type { PluginInvokeEventNameType } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { PluginPermissionEnumType } from '@domain/value-objects/permission.vo';

import type {
  InvokeOptions,
  LocalPoolServiceConfigType as ServiceConfig,
  PluginServiceCallbacks
} from '../types';

export type { ServiceConfig };

export interface ServiceRuntimeOptions {
  serviceName: string;
  pluginPath: string;
  getConfig: () => ServiceConfig;
  callbacks: PluginServiceCallbacks;
  pluginPermissions: PluginPermissionEnumType[];
  getInvokeSession: (invocationId?: string) => InvokePort | undefined;
  isDestroyed: () => boolean;
  onPodCrashed: () => void;
  onPodChanged: () => void;
  onPodStartupBlocked: () => void;
  onPodStartupRetryable: (delayMs: number) => void;
}

export interface ServiceRequestInput {
  eventName: PluginInvokeEventNameType;
  payload: unknown;
  returnStream: boolean;
  options?: InvokeOptions;
  startedAt?: number;
  queuedAt?: number;
}

export interface ServiceRequest {
  requestId: string;
  eventName: PluginInvokeEventNameType;
  payload: unknown;
  returnStream: boolean;
  options?: InvokeOptions;
  startedAt: number;
  queuedAt?: number;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout?: NodeJS.Timeout;
}

export interface CreatedServiceRequest {
  request: ServiceRequest;
  promise: Promise<unknown>;
}
