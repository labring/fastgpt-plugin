import z from 'zod';

export const I18nLangSchema = z.enum(['en', 'zh-CN', 'zh-Hant']);

export const I18nLangEnum = I18nLangSchema.enum;

export type I18nLangType = z.infer<typeof I18nLangSchema>;

export const I18nStringSchema = z.object({
  [I18nLangEnum.en]: z.string(),
  [I18nLangEnum['zh-CN']]: z.string(),
  [I18nLangEnum['zh-Hant']]: z.string().optional()
});

export type I18nStringType = z.infer<typeof I18nStringSchema>;

export function coerceI18nString(value: unknown): unknown {
  if (typeof value === 'string') {
    return { en: value, 'zh-CN': value };
  }

  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const translations = value as Record<string, unknown>;
  const en = typeof translations.en === 'string' ? translations.en : undefined;
  const zhCN =
    typeof translations['zh-CN'] === 'string'
      ? translations['zh-CN']
      : typeof translations.zh === 'string'
        ? translations.zh
        : undefined;
  const zhHant =
    typeof translations['zh-Hant'] === 'string' ? translations['zh-Hant'] : undefined;
  const fallback = zhCN ?? en ?? zhHant;

  if (fallback === undefined) {
    return value;
  }

  return {
    en: en ?? fallback,
    'zh-CN': zhCN ?? fallback,
    ...(zhHant !== undefined ? { 'zh-Hant': zhHant } : {})
  };
}

export const TolerantI18nStringSchema = z.preprocess(coerceI18nString, I18nStringSchema);

export const I18nStringStrictSchema = z.object({
  [I18nLangEnum.en]: z.string(),
  [I18nLangEnum['zh-CN']]: z.string(),
  [I18nLangEnum['zh-Hant']]: z.string()
});

export type I18nStringStrictType = z.infer<typeof I18nStringStrictSchema>;
