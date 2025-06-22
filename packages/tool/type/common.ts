import { z } from 'zod';

export const InfoString = z.object({
  en: z.string(),
  'zh-CN': z.string().optional(),
  'zh-Hant': z.string().optional()
});
