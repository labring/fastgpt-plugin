import { z } from 'zod';

export const I18nStringSchema = z.object({
  en: z.string(),
  'zh-CN': z.string().optional(),
  'zh-Hant': z.string().optional()
});

export const I18nStringStrictSchema = z.object({
  en: z.string(),
  'zh-CN': z.string(),
  'zh-Hant': z.string()
});

export type I18nStringType = z.infer<typeof I18nStringSchema>;
export type I18nStringStrictType = z.infer<typeof I18nStringStrictSchema>;
