import { describe, expect, it } from 'vitest';

import {
  isPluginDebugSessionSource,
  makePluginDebugSessionSource,
  parsePluginDebugSessionSource
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
