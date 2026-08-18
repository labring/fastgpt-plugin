import { describe, expect, it } from 'vitest';

import { getFCFunctionName, getFCRuntimeId } from './function-name';

describe('FC function naming', () => {
  it('builds stable runtime ids', () => {
    expect(getFCRuntimeId({ pluginId: 'getTime', version: '1.0.0', etag: 'abc' })).toBe(
      'fc@getTime@1.0.0@abc'
    );
  });

  it('encodes ids into FC-safe function names with hash suffix', () => {
    const name = getFCFunctionName(
      { pluginId: 'Get Time!', version: '1.0.0', etag: 'abc/def' },
      'fastgpt-plugin'
    );

    expect(name).toMatch(/^fastgpt-plugin-get-time-1-0-0-abc-def-[a-f0-9]{12}$/);
    expect(name.length).toBeLessThanOrEqual(64);
  });

  it('keeps long names within FC limits', () => {
    const name = getFCFunctionName(
      { pluginId: 'a'.repeat(100), version: '1.0.0', etag: 'b'.repeat(100) },
      'fastgpt-plugin'
    );

    expect(name.length).toBeLessThanOrEqual(64);
    expect(name).toMatch(/[a-f0-9]{12}$/);
  });
});
