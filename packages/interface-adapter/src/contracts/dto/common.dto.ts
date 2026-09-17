import { z } from 'zod';

import { I18nStringSchema, I18nStringStrictSchema } from '@domain/value-objects/i18n-string.vo';
import { SystemVarSchema } from '@domain/value-objects/system-var.vo';

export const I18nStringDTOSchema = z.object(I18nStringSchema.shape);
export const I18nStringStrictDTOSchema = z.object(I18nStringStrictSchema.shape);

export const SystemVarDTOSchema = z.object({
  ...SystemVarSchema.shape
});

export const PluginSourceDTOSchema = z.string();

export const arrayQueryParam = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => {
    if (value == null) {
      return undefined;
    }

    return Array.isArray(value) ? value : [value];
  }, z.array(schema).optional());

export const booleanQueryParam = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value !== 'string') {
      return value;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return value;
  }, schema);

export type ErrorResponseDTOType = {
  code: string;
  message: string;
  reason: z.infer<typeof I18nStringDTOSchema>;
  data?: unknown;
  cause?: unknown;
};

export const ErrorResponseDTOSchema: z.ZodType<ErrorResponseDTOType> = z.object({
  code: z.string(),
  message: z.string(),
  reason: I18nStringDTOSchema,
  data: z.unknown().optional(),
  cause: z.unknown().optional()
  // cause: z.lazy(() => ErrorResponseDTOSchema).optional()
});

export type I18nStringDTOType = z.infer<typeof I18nStringDTOSchema>;
export type I18nStringStrictDTOType = z.infer<typeof I18nStringStrictDTOSchema>;
