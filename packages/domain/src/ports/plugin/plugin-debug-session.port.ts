import type {
  PluginDebugSession,
  PluginDebugSessionId,
  PluginDebugSessionTmbId
} from '@domain/value-objects/plugin-debug-session.vo';

export type CreatePluginDebugSessionInput = {
  tmbId: PluginDebugSessionTmbId;
  ttlMs: number;
  ticketTtlMs: number;
  now?: number;
};

export type CreatePluginDebugSessionOutput = {
  session: PluginDebugSession;
  ticket: string;
  revokedSession?: PluginDebugSession;
};

export type ExchangePluginDebugSessionTicketOutput = {
  session: PluginDebugSession;
};

export interface PluginDebugSessionPort {
  create(input: CreatePluginDebugSessionInput): Promise<CreatePluginDebugSessionOutput>;
  exchangeTicket(ticket: string, now?: number): Promise<ExchangePluginDebugSessionTicketOutput>;
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
