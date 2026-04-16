import z from 'zod';

import { I18nStringSchema, I18nStringStrictSchema } from '@domain/value-objects/i18n-string.vo';

export const I18nStringDTOSchema = z.object(I18nStringSchema.shape);
export const I18nStringStrictDTOSchema = z.object(I18nStringStrictSchema.shape);
