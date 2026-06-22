const MongoDollarKeyPrefix = '__fastgpt_mongo_dollar__';

const PluginSchemaFieldNames = ['inputSchema', 'outputSchema', 'secretSchema'] as const;
const ChildSchemaFieldNames = ['inputSchema', 'outputSchema'] as const;

type TransformMode = 'encode' | 'decode';

const hasOwn = (value: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);

const transformKey = (key: string, mode: TransformMode) => {
  if (mode === 'encode') {
    if (key.startsWith(MongoDollarKeyPrefix)) {
      return `${MongoDollarKeyPrefix}${key}`;
    }

    return key.startsWith('$') ? `${MongoDollarKeyPrefix}${key.slice(1)}` : key;
  }

  if (key.startsWith(`${MongoDollarKeyPrefix}${MongoDollarKeyPrefix}`)) {
    return key.slice(MongoDollarKeyPrefix.length);
  }

  return key.startsWith(MongoDollarKeyPrefix) ? `$${key.slice(MongoDollarKeyPrefix.length)}` : key;
};

const transformSchemaNode = (value: unknown, mode: TransformMode): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => transformSchemaNode(item, mode));
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      transformKey(key, mode),
      transformSchemaNode(nestedValue, mode)
    ])
  );
};

const transformPluginDataJsonSchemaMongoKeys = <T>(data: T, mode: TransformMode): T => {
  if (!isRecord(data)) {
    return data;
  }

  const nextData: Record<string, unknown> = { ...data };

  for (const fieldName of PluginSchemaFieldNames) {
    if (hasOwn(nextData, fieldName)) {
      nextData[fieldName] = transformSchemaNode(nextData[fieldName], mode);
    }
  }

  if (Array.isArray(nextData.children)) {
    nextData.children = nextData.children.map((child) => {
      if (!isRecord(child)) {
        return child;
      }

      const nextChild: Record<string, unknown> = { ...child };
      for (const fieldName of ChildSchemaFieldNames) {
        if (hasOwn(nextChild, fieldName)) {
          nextChild[fieldName] = transformSchemaNode(nextChild[fieldName], mode);
        }
      }

      return nextChild;
    });
  }

  return nextData as T;
};

export const encodePluginRecordJsonSchemaMongoKeys = <T extends { data?: unknown }>(
  record: T
): T =>
  ({
    ...record,
    data: transformPluginDataJsonSchemaMongoKeys(record.data, 'encode')
  }) as T;

export const decodePluginRecordJsonSchemaMongoKeys = <T extends { data?: unknown }>(
  record: T
): T =>
  ({
    ...record,
    data: transformPluginDataJsonSchemaMongoKeys(record.data, 'decode')
  }) as T;

export const decodePluginDataJsonSchemaMongoKeys = <T>(data: T): T =>
  transformPluginDataJsonSchemaMongoKeys(data, 'decode');
