import z from 'zod';

export const I18nLangSchema = z.enum(['en', 'zh-CN', 'zh-Hant']);

export const I18nLangEnum = I18nLangSchema.enum;

export type I18nLangType = z.infer<typeof I18nLangSchema>;

export const I18nStringSchema = z.object({
  [I18nLangEnum.en]: z.string(),
  [I18nLangEnum['zh-CN']]: z.string().optional(),
  [I18nLangEnum['zh-Hant']]: z.string().optional()
});

export type I18nStringType = z.infer<typeof I18nStringSchema>;

export const I18nStringStrictSchema = z.object({
  [I18nLangEnum.en]: z.string(),
  [I18nLangEnum['zh-CN']]: z.string(),
  [I18nLangEnum['zh-Hant']]: z.string()
});

export type I18nStringStrictType = z.infer<typeof I18nStringStrictSchema>;
