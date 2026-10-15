import z from 'zod';

import type { I18nStringType } from '@domain/value-objects/i18n-string.vo';

type UiFieldDefinition<T extends z.ZodType> = {
  type: T;
  title: I18nStringType;
  description?: I18nStringType;
  placeholder?: never;
};

export type InputFieldDefinition<T extends z.ZodType = z.ZodType> = UiFieldDefinition<T> & {
  isToolParam?: boolean;
};

export type OutputFieldDefinition<T extends z.ZodType = z.ZodType> = UiFieldDefinition<T> & {
  isToolParam?: never;
};

type FieldDefinition = UiFieldDefinition<z.ZodType> & {
  isToolParam?: boolean;
};
type FieldMap<T extends Record<string, FieldDefinition>> = {
  -readonly [K in keyof T]: T[K]['type'];
};

function isNonEmptyRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  for (const key in value) {
    if (Object.hasOwn(value, key)) {
      return true;
    }
  }

  return false;
}

function createSchemaFromFields<const T extends Record<string, FieldDefinition>>(
  fields: T
): z.ZodObject<FieldMap<T>> {
  const shape: Record<string, z.ZodType> = Object.create(null);

  for (const key in fields) {
    if (!Object.hasOwn(fields, key)) {
      continue;
    }

    const field = fields[key];
    const existingMetadata = field.type.meta() ?? {};
    const existingI18n = isNonEmptyRecord(existingMetadata['x-i18n'])
      ? existingMetadata['x-i18n']
      : {};
    const i18nMetadata: Record<string, unknown> = { ...existingI18n };
    const mergedMetadata: z.GlobalMeta = {
      ...existingMetadata,
      title: field.title['zh-CN'],
      'x-i18n': i18nMetadata
    };
    mergedMetadata.toolDescription = undefined;

    i18nMetadata.title = field.title;

    if (field.description !== undefined) {
      mergedMetadata.description = field.description['zh-CN'];
      i18nMetadata.description = field.description;
    }


    if (field.isToolParam !== undefined) {
      mergedMetadata.isToolParam = field.isToolParam;
    }

    shape[key] = field.type.meta(mergedMetadata);
  }

  return z.object(shape) as z.ZodObject<FieldMap<T>>;
}

export function defineInputSchema<const T extends Record<string, InputFieldDefinition>>(
  fields: T
): z.ZodObject<{ -readonly [K in keyof T]: T[K]['type'] }> {
  return createSchemaFromFields(fields);
}

export function defineOutputSchema<const T extends Record<string, OutputFieldDefinition>>(
  fields: T
): z.ZodObject<{ -readonly [K in keyof T]: T[K]['type'] }> {
  return createSchemaFromFields(fields);
}
