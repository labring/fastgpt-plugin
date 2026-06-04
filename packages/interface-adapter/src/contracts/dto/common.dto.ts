import z from 'zod';

import { I18nStringSchema, I18nStringStrictSchema } from '@domain/value-objects/i18n-string.vo';

export const I18nStringDTOSchema = z.object(I18nStringSchema.shape);
export const I18nStringStrictDTOSchema = z.object(I18nStringStrictSchema.shape);

export type ErrorResponseDTOType = {
  code: string;
  message: string;
  reason: z.infer<typeof I18nStringDTOSchema>;
  data?: unknown;
  cause?: ErrorResponseDTOType;
};

export const ErrorResponseDTOSchema: z.ZodType<ErrorResponseDTOType> = z.object({
  code: z.string(),
  message: z.string(),
  reason: I18nStringDTOSchema,
  data: z.unknown().optional(),
  cause: z.lazy(() => ErrorResponseDTOSchema).optional()
});

export type I18nStringDTOType = z.infer<typeof I18nStringDTOSchema>;
export type I18nStringStrictDTOType = z.infer<typeof I18nStringStrictDTOSchema>;
