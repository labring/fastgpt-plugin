import z from 'zod';

import {
  PluginChannelClientMethod,
  PluginChannelClientMethodSchema,
  type PluginChannelClientToHostNotifications,
  type PluginChannelClientToHostRequests
} from './client';
import {
  PluginChannelCommonMethod,
  PluginChannelCommonMethodSchema,
  type PluginChannelCommonNotifications
} from './common';
import {
  PluginChannelHostMethod,
  PluginChannelHostMethodSchema,
  type PluginChannelHostToClientRequests
} from './host';

export * from './client';
export * from './common';
export * from './host';

export const PluginChannelMethod = {
  client: PluginChannelClientMethod,
  common: PluginChannelCommonMethod,
  host: PluginChannelHostMethod
} as const;

export const PluginChannelKnownMethodSchema = z.union([
  PluginChannelClientMethodSchema,
  PluginChannelCommonMethodSchema,
  PluginChannelHostMethodSchema
]);
export type PluginChannelKnownMethod = z.infer<typeof PluginChannelKnownMethodSchema>;
export type PluginChannelMethodType = PluginChannelKnownMethod | (string & {});

export type PluginChannelClientSendRequestMap = PluginChannelClientToHostRequests;
export type PluginChannelClientSendNotificationMap = PluginChannelClientToHostNotifications &
  PluginChannelCommonNotifications;

export type PluginChannelHostSendRequestMap = PluginChannelHostToClientRequests;
export type PluginChannelHostSendNotificationMap = PluginChannelCommonNotifications;

export type PluginChannelKnownRequestMap = PluginChannelClientSendRequestMap &
  PluginChannelHostSendRequestMap;

export type PluginChannelKnownNotificationMap = PluginChannelClientSendNotificationMap &
  PluginChannelHostSendNotificationMap;

/**
 * 当前 side 允许主动发送的 request。
 */
export type PluginChannelSendRequestMap<TSide extends 'host' | 'client'> = TSide extends 'host'
  ? PluginChannelHostSendRequestMap
  : PluginChannelClientSendRequestMap;

/**
 * 当前 side 允许主动发送的 notification。
 */
export type PluginChannelSendNotificationMap<TSide extends 'host' | 'client'> = TSide extends 'host'
  ? PluginChannelHostSendNotificationMap
  : PluginChannelClientSendNotificationMap;

/**
 * 当前 side 会从对端收到的 request。
 */
export type PluginChannelReceiveRequestMap<TSide extends 'host' | 'client'> = TSide extends 'host'
  ? PluginChannelClientSendRequestMap
  : PluginChannelHostSendRequestMap;

/**
 * 当前 side 会从对端收到的 notification。
 */
export type PluginChannelReceiveNotificationMap<TSide extends 'host' | 'client'> =
  TSide extends 'host'
    ? PluginChannelClientSendNotificationMap
    : PluginChannelHostSendNotificationMap;

export type PluginChannelRequestParams<TMethod extends keyof PluginChannelKnownRequestMap> =
  PluginChannelKnownRequestMap[TMethod]['params'];

export type PluginChannelRequestResultData<TMethod extends keyof PluginChannelKnownRequestMap> =
  PluginChannelKnownRequestMap[TMethod]['result'];

export type PluginChannelRequestInput<TMethod extends keyof PluginChannelKnownRequestMap> =
  PluginChannelKnownRequestMap[TMethod]['input'];

export type PluginChannelRequestOutput<TMethod extends keyof PluginChannelKnownRequestMap> =
  PluginChannelKnownRequestMap[TMethod]['output'];

export type PluginChannelNotificationParams<
  TMethod extends keyof PluginChannelKnownNotificationMap
> = PluginChannelKnownNotificationMap[TMethod]['params'];

export type PluginChannelSideRequestParams<
  TSide extends 'host' | 'client',
  TMethod extends keyof PluginChannelSendRequestMap<TSide>
> = PluginChannelSendRequestMap<TSide>[TMethod] extends { params: infer TParams } ? TParams : never;

export type PluginChannelSideRequestResultData<
  TSide extends 'host' | 'client',
  TMethod extends keyof PluginChannelSendRequestMap<TSide>
> = PluginChannelSendRequestMap<TSide>[TMethod] extends { result: infer TResult } ? TResult : never;

export type PluginChannelSideRequestInput<
  TSide extends 'host' | 'client',
  TMethod extends keyof PluginChannelSendRequestMap<TSide>
> = PluginChannelSendRequestMap<TSide>[TMethod] extends { input: infer TInput } ? TInput : never;

export type PluginChannelSideRequestOutput<
  TSide extends 'host' | 'client',
  TMethod extends keyof PluginChannelSendRequestMap<TSide>
> = PluginChannelSendRequestMap<TSide>[TMethod] extends { output: infer TOutput } ? TOutput : never;

export type PluginChannelSideNotificationParams<
  TSide extends 'host' | 'client',
  TMethod extends keyof PluginChannelSendNotificationMap<TSide>
> = PluginChannelSendNotificationMap<TSide>[TMethod] extends { params: infer TParams }
  ? TParams
  : never;

export type PluginChannelReceiveRequestParams<
  TSide extends 'host' | 'client',
  TMethod extends keyof PluginChannelReceiveRequestMap<TSide>
> = PluginChannelReceiveRequestMap<TSide>[TMethod] extends { params: infer TParams }
  ? TParams
  : never;

export type PluginChannelReceiveRequestResultData<
  TSide extends 'host' | 'client',
  TMethod extends keyof PluginChannelReceiveRequestMap<TSide>
> = PluginChannelReceiveRequestMap<TSide>[TMethod] extends { result: infer TResult }
  ? TResult
  : never;

export type PluginChannelReceiveRequestInput<
  TSide extends 'host' | 'client',
  TMethod extends keyof PluginChannelReceiveRequestMap<TSide>
> = PluginChannelReceiveRequestMap<TSide>[TMethod] extends { input: infer TInput } ? TInput : never;

export type PluginChannelReceiveRequestOutput<
  TSide extends 'host' | 'client',
  TMethod extends keyof PluginChannelReceiveRequestMap<TSide>
> = PluginChannelReceiveRequestMap<TSide>[TMethod] extends { output: infer TOutput }
  ? TOutput
  : never;

export type PluginChannelReceiveNotificationParams<
  TSide extends 'host' | 'client',
  TMethod extends keyof PluginChannelReceiveNotificationMap<TSide>
> = PluginChannelReceiveNotificationMap<TSide>[TMethod] extends { params: infer TParams }
  ? TParams
  : never;

export type PluginChannelSendMethodType<TSide extends 'host' | 'client'> =
  | keyof PluginChannelSendRequestMap<TSide>
  | keyof PluginChannelSendNotificationMap<TSide>;

export type PluginChannelReceiveMethodType<TSide extends 'host' | 'client'> =
  | keyof PluginChannelReceiveRequestMap<TSide>
  | keyof PluginChannelReceiveNotificationMap<TSide>;
