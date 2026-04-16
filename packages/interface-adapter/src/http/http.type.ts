import z from 'zod';

import type { I18nStringType } from '@domain/value-objects/i18n-string.vo';

export const HTTPMethodSchema = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
export const HTTPMethodEnum = HTTPMethodSchema.enum;
export type HTTPMethodType = keyof typeof HTTPMethodEnum;

export const StatusCodeSchema = z.number().min(100).max(599);
export type StatusCodeType = z.infer<typeof StatusCodeSchema>;

export const QuerySchema = z.record(z.string(), z.string());
export const BodySchema = z.unknown();

export type BasicResponseType = {
  error?: I18nStringType;
  data?: unknown;
};
