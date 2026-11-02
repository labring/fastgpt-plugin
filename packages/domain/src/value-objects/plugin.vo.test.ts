import { describe, expect, it } from 'vitest';

import {
  PluginRuntimeModeEnum,
  PluginRuntimeModeSchema
} from './plugin.vo';

describe('PluginRuntimeModeSchema', () => {
  it('parses valid runtime modes correctly', () => {
    expect(PluginRuntimeModeSchema.parse('localPool')).toBe(
      PluginRuntimeModeEnum.localPool
    );
    expect(PluginRuntimeModeSchema.parse('serverless')).toBe(
      PluginRuntimeModeEnum.serverless
    );
  });

  it('falls back to unknown when receiving unrecognized runtime mode', () => {
    expect(PluginRuntimeModeSchema.parse('k8s')).toBe(
      PluginRuntimeModeEnum.unknown
    );
    expect(PluginRuntimeModeSchema.parse('docker')).toBe(
      PluginRuntimeModeEnum.unknown
    );
    expect(PluginRuntimeModeSchema.parse(null)).toBe(
      PluginRuntimeModeEnum.unknown
    );
  });
});
