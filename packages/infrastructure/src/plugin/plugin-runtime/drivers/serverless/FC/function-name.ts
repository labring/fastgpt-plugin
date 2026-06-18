import { createHash } from 'node:crypto';

import type { PluginUniqueIdType } from '@domain/value-objects/plugin.vo';

const MAX_FUNCTION_NAME_LENGTH = 64;

export function getFCRuntimeId({ etag, pluginId, version }: PluginUniqueIdType): string {
  assertUniqueIdPart('pluginId', pluginId);
  assertUniqueIdPart('version', version);
  assertUniqueIdPart('etag', etag);

  return `fc@${pluginId}@${version}@${etag}`;
}

export function getFCFunctionName(uniqueId: PluginUniqueIdType, prefix: string): string {
  const rawPrefix = normalizeFunctionNamePart(prefix || 'fastgpt-plugin');
  const body = [uniqueId.pluginId, uniqueId.version, uniqueId.etag]
    .map((part, index) => {
      assertUniqueIdPart(['pluginId', 'version', 'etag'][index], part);
      return normalizeFunctionNamePart(part);
    })
    .join('-');
  const hash = createHash('sha256')
    .update(`${uniqueId.pluginId}@${uniqueId.version}@${uniqueId.etag}`)
    .digest('hex')
    .slice(0, 12);
  const suffix = `-${hash}`;
  const base = `${rawPrefix}-${body}`;
  const maxBaseLength = MAX_FUNCTION_NAME_LENGTH - suffix.length;

  return `${base.slice(0, maxBaseLength).replace(/-+$/g, '')}${suffix}`;
}

function normalizeFunctionNamePart(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'plugin';
}

function assertUniqueIdPart(name: string | undefined, value: string): void {
  if (!value || !value.trim()) {
    throw new Error(`${name ?? 'uniqueId'} is required`);
  }
}
