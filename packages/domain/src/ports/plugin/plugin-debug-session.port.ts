import type {
  PluginDebugSession,
  PluginDebugSessionId,
  PluginDebugSessionTmbId
} from '@domain/value-objects/plugin-debug-session.vo';

export type CreatePluginDebugSessionInput = {
  tmbId: PluginDebugSessionTmbId;
  ttlMs: number;
  connectKeyTtlMs: number;
  now?: number;
};

export type CreatePluginDebugSessionOutput = {
  session: PluginDebugSession;
  connectKey: string;
  revokedSession?: PluginDebugSession;
};

export type ExchangePluginDebugSessionConnectKeyOutput = {
  session: PluginDebugSession;
};

export interface PluginDebugSessionPort {
  create(input: CreatePluginDebugSessionInput): Promise<CreatePluginDebugSessionOutput>;
  exchangeConnectKey(
    connectKey: string,
    now?: number
  ): Promise<ExchangePluginDebugSessionConnectKeyOutput>;
  get(input: {
    tmbId: PluginDebugSessionTmbId;
    debugSessionId: PluginDebugSessionId;
    now?: number;
  }): Promise<PluginDebugSession | null>;
  revoke(input: {
    tmbId: PluginDebugSessionTmbId;
    debugSessionId: PluginDebugSessionId;
    now?: number;
  }): Promise<PluginDebugSession | null>;
  setGatewaySession(input: {
    tmbId: PluginDebugSessionTmbId;
    debugSessionId: PluginDebugSessionId;
    gatewaySessionId: string;
    now?: number;
  }): Promise<PluginDebugSession | null>;
}
