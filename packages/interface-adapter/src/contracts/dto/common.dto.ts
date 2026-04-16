import z from 'zod';

import { I18nStringSchema } from '@domain/value-objects/i18n-string.vo';

export const I18nStringDTOSchema = z.object(I18nStringSchema.shape);
