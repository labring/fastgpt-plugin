import { describe, expect, it } from 'vitest';

import { DEFAULT_DEBUG_LOCALE, selectDebugText } from './session';

describe('debug locale fallback', () => {
  it('defaults to English and falls back to English when a locale is missing', () => {
    expect(DEFAULT_DEBUG_LOCALE).toBe('en');
    expect(selectDebugText({ en: 'Query', 'zh-CN': '查询' })).toBe('Query');
    expect(selectDebugText({ en: 'Query', 'zh-CN': '查询' }, 'zh-Hant')).toBe('Query');
  });
});
