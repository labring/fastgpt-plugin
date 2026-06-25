const PluginSchemaFieldNames = ['inputSchema', 'outputSchema', 'secretSchema'] as const;
const ChildSchemaFieldNames = ['inputSchema', 'outputSchema'] as const;

type SchemaFieldTransform = (value: unknown) => unknown;

const hasOwn = (value: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);

const serializeSchemaField: SchemaFieldTransform = (value) =>
  typeof value === 'string' ? value : JSON.stringify(value);

const deserializeSchemaField: SchemaFieldTransform = (value) =>
  typeof value === 'string' ? JSON.parse(value) : value;

const transformPluginDataJsonSchemaFields = <T>(data: T, transform: SchemaFieldTransform): T => {
  if (!isRecord(data)) {
    return data;
  }

  const nextData: Record<string, unknown> = { ...data };

  for (const fieldName of PluginSchemaFieldNames) {
    if (hasOwn(nextData, fieldName)) {
      nextData[fieldName] = transform(nextData[fieldName]);
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
          nextChild[fieldName] = transform(nextChild[fieldName]);
        }
      }

      return nextChild;
    });
  }

  return nextData as T;
};

export const serializePluginRecordJsonSchemaFields = <T extends { data?: unknown }>(record: T): T =>
  ({
    ...record,
    data: transformPluginDataJsonSchemaFields(record.data, serializeSchemaField)
  }) as T;

export const deserializePluginRecordJsonSchemaFields = <T extends { data?: unknown }>(
  record: T
): T =>
  ({
    ...record,
    data: transformPluginDataJsonSchemaFields(record.data, deserializeSchemaField)
  }) as T;

export const deserializePluginDataJsonSchemaFields = <T>(data: T): T =>
  transformPluginDataJsonSchemaFields(data, deserializeSchemaField);
