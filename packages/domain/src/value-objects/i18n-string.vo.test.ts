import { describe, expect, it } from 'vitest';

import { I18nStringSchema, TolerantI18nStringSchema } from './i18n-string.vo';

describe('I18nStringSchema', () => {
  it('requires Simplified Chinese translations', () => {
    expect(() => I18nStringSchema.parse({ en: 'English' })).toThrow();
  });

  it('accepts English and Simplified Chinese translations without Korean', () => {
    expect(
      I18nStringSchema.parse({
        en: 'English',
        'zh-CN': '简体中文'
      })
    ).toEqual({
      en: 'English',
      'zh-CN': '简体中文'
    });
  });
});

describe('TolerantI18nStringSchema', () => {
  it('duplicates a legacy string into required languages', () => {
    expect(TolerantI18nStringSchema.parse('Google Search')).toEqual({
      en: 'Google Search',
      'zh-CN': 'Google Search'
    });
  });

  it('fills missing required language from an existing translation', () => {
    expect(TolerantI18nStringSchema.parse({ 'zh-CN': '谷歌搜索' })).toEqual({
      en: '谷歌搜索',
      'zh-CN': '谷歌搜索'
    });
    expect(TolerantI18nStringSchema.parse({ en: 'Google Search' })).toEqual({
      en: 'Google Search',
      'zh-CN': 'Google Search'
    });
  });

  it('accepts the legacy zh key and preserves existing translations', () => {
    expect(TolerantI18nStringSchema.parse({ zh: '谷歌搜索' })).toEqual({
      en: '谷歌搜索',
      'zh-CN': '谷歌搜索'
    });
    expect(
      TolerantI18nStringSchema.parse({
        en: 'Google Search',
        'zh-CN': '谷歌搜索',
        'zh-Hant': '谷歌搜尋'
      })
    ).toEqual({
      en: 'Google Search',
      'zh-CN': '谷歌搜索',
      'zh-Hant': '谷歌搜尋'
    });
  });

  it('does not relax the strict schema', () => {
    expect(() => I18nStringSchema.parse({ en: 'Only' })).toThrow();
  });
});
