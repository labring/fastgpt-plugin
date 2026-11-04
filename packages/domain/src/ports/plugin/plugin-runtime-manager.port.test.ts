import { describe, expect, it } from 'vitest';

import {
  PluginInvokeEventnameEnum,
  PluginInvokeEventnameSchema
} from './plugin-runtime-manager.port';

describe('PluginInvokeEventnameSchema', () => {
  it('parses valid event names correctly', () => {
    expect(PluginInvokeEventnameSchema.parse('run')).toBe(
      PluginInvokeEventnameEnum.run
    );
  });

  it('falls back to unknown when receiving unrecognized event name', () => {
    expect(PluginInvokeEventnameSchema.parse('stop')).toBe(
      PluginInvokeEventnameEnum.unknown
    );
    expect(PluginInvokeEventnameSchema.parse('pause')).toBe(
      PluginInvokeEventnameEnum.unknown
    );
    expect(PluginInvokeEventnameSchema.parse(null)).toBe(
      PluginInvokeEventnameEnum.unknown
    );
  });
});
