import type {
  PluginDebugSession,
  PluginDebugSessionTmbId
} from '@domain/value-objects/plugin-debug-session.vo';

export type CreatePluginDebugSessionInput = {
  tmbId: PluginDebugSessionTmbId;
  now?: number;
};

export type CreatePluginDebugSessionOutput = {
  session: PluginDebugSession;
  connectionKey?: string;
  revokedSession?: PluginDebugSession;
};

export type ExchangePluginDebugSessionConnectionKeyOutput = {
  session: PluginDebugSession;
};

export interface PluginDebugSessionPort {
  create(input: CreatePluginDebugSessionInput): Promise<CreatePluginDebugSessionOutput>;
  refresh(input: CreatePluginDebugSessionInput): Promise<CreatePluginDebugSessionOutput>;
  exchangeConnectionKey(
    connectionKey: string,
    now?: number
  ): Promise<ExchangePluginDebugSessionConnectionKeyOutput>;
  get(input: { tmbId: PluginDebugSessionTmbId; now?: number }): Promise<PluginDebugSession | null>;
  revoke(input: { tmbId: PluginDebugSessionTmbId; now?: number }): Promise<PluginDebugSession | null>;
}
