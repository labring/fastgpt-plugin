/**
 * 飞书 API 响应类型
 */
export interface FeishuResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

/**
 * 多维表格应用
 */
export interface BitableApp {
  app_token: string;
  name?: string;
  is_advanced?: boolean;
  time_zone?: string;
  url?: string;
}

/**
 * 数据表
 */
export interface Table {
  table_id: string;
  name: string;
  revision?: number;
  default_view_id?: string;
}

/**
 * 记录
 */
export interface BitableRecord {
  record_id: string;
  fields: Record<string, any>;
  created_time?: number;
  created_by?: {
    id: string;
    name: string;
  };
  last_modified_time?: number;
  last_modified_by?: {
    id: string;
    name: string;
  };
}

/**
 * 字段配置
 */
export interface Field {
  field_id: string;
  field_name: string;
  type: number;
  property?: any;
  description?: {
    content: string;
  };
  is_primary?: boolean;
}

/**
 * 分页响应
 */
export interface PagedResponse<T> {
  has_more: boolean;
  page_token?: string;
  items: T[];
  total?: number;
}
