import json5 from 'json5';

/**
 * 格式化 JSON 输出
 */
export function formatJsonOutput(data: any): string {
  if (typeof data === 'string') {
    return data;
  }
  return JSON.stringify(data, null, 2);
}

/**
 * 解析 JSON 字符串
 */
export function parseJsonSafely(jsonString: string): Record<string, any> {
  try {
    return json5.parse(jsonString);
  } catch (error) {
    throw new Error(
      `Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * 构建分页参数
 */
export function buildPaginationParams(pageSize?: number, pageToken?: string) {
  const params: Record<string, any> = {};

  if (pageSize !== undefined && pageSize > 0) {
    params.page_size = pageSize;
  }

  if (pageToken) {
    params.page_token = pageToken;
  }

  return params;
}

/**
 * 提取字段值
 */
export function extractFieldValue(record: any, fieldName: string): any {
  if (!record || !record.fields) {
    return null;
  }
  return record.fields[fieldName] || null;
}
