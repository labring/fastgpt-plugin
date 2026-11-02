import { describe, expect, it } from 'vitest';

import {
  isPluginDebugSessionSource,
  makePluginDebugSessionSource,
  parsePluginDebugSessionSource,
  PluginDebugSessionStatusEnum,
  PluginDebugSessionStatusSchema
} from './plugin-debug-session.vo';

describe('plugin debug session source', () => {
  it('builds and parses a tmbId scoped debug source', () => {
    const source = makePluginDebugSessionSource({
      tmbId: 'tmb-1'
    });

    expect(source).toBe('debug:tmbId:tmb-1');
    expect(parsePluginDebugSessionSource(source)).toEqual({
      tmbId: 'tmb-1'
    });
    expect(isPluginDebugSessionSource(source)).toBe(true);
  });

  it('rejects plugin-scoped and legacy debug sources', () => {
    expect(parsePluginDebugSessionSource('debug:user:u1')).toBeNull();
    expect(parsePluginDebugSessionSource('debug:tmbId:t1:plugin:p1')).toBeNull();
    expect(parsePluginDebugSessionSource('debug:tmbId:t1:session:s1')).toBeNull();
  });
});

describe('PluginDebugSessionStatusSchema', () => {
  it('parses valid debug session statuses correctly', () => {
    expect(PluginDebugSessionStatusSchema.parse('enabled')).toBe(
      PluginDebugSessionStatusEnum.enabled
    );
    expect(PluginDebugSessionStatusSchema.parse('connected')).toBe(
      PluginDebugSessionStatusEnum.connected
    );
    expect(PluginDebugSessionStatusSchema.parse('disconnected')).toBe(
      PluginDebugSessionStatusEnum.disconnected
    );
    expect(PluginDebugSessionStatusSchema.parse('revoked')).toBe(
      PluginDebugSessionStatusEnum.revoked
    );
  });

  it('falls back to unknown when receiving unrecognized status', () => {
    expect(PluginDebugSessionStatusSchema.parse('expired')).toBe(
      PluginDebugSessionStatusEnum.unknown
    );
    expect(PluginDebugSessionStatusSchema.parse('terminated')).toBe(
      PluginDebugSessionStatusEnum.unknown
    );
    expect(PluginDebugSessionStatusSchema.parse(null)).toBe(
      PluginDebugSessionStatusEnum.unknown
    );
  });
});
