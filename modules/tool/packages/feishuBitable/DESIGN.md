# 飞书多维表格工具集设计文档

## 功能描述

本工具集为 FastGPT 提供飞书多维表格（Bitable）的完整操作能力，采用 ToolSet 架构设计。

### 工具集类型
- **类型**: ToolSet（工具集）
- **包含子工具数量**: 13 个

### 子工具列表

#### 表格应用（BiTable）管理工具（3个）
1. **biTableCreate** - 新增表格应用
2. **biTableGet** - 获取表格应用元数据
3. **biTableUpdate** - 更新表格应用元数据

#### 数据表（DataTable）管理工具（5个）
5. **dataTableCreate** - 新增数据表
6. **dataTableDelete** - 删除数据表
7. **dataTableUpdate** - 更新数据表
8. **dataTableGetTables** - 获取所有数据表列表
9. **dataTableGetTableFields** - 获取数据表字段配置

#### 记录（Record）管理工具（5个）
10. **recordList** - 批量获取记录数据
11. **recordGet** - 获取单个记录数据
12. **recordCreate** - 创建记录
13. **recordUpdate** - 更新记录
14. **recordDelete** - 删除记录

## 参考文档

- [飞书开放平台 - 多维表格 API 文档](https://open.feishu.cn/document/server-docs/docs/bitable-v1/bitable-overview)
- [多维表格应用 API](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app)
- [数据表管理 API](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table/list)
- [记录查询 API](https://open.feishu.cn/document/docs/bitable-v1/app-table-record/search)
- [记录列表 API](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/list)
- [字段管理 API](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-field/list)

## 工具目录结构

```
modules/tool/packages/feishuTable/
├── index.ts                          # 工具集导出主文件
├── config.ts                         # 工具集配置文件
├── package.json                      # 依赖管理
├── client.ts                         # 共享的飞书 API 客户端逻辑
├── utils.ts                          # 共享工具函数
├── types.ts                          # TypeScript 类型定义
├── DESIGN.md                         # 本设计文档
└── children/                         # 子工具目录
    ├── biTableCreate/               # 新增多维表格应用
    │   ├── index.ts
    │   ├── config.ts
    │   ├── src/
    │   │   └── index.ts
    │   └── test/
    │       └── index.test.ts
    ├── biTableDelete/               # 删除多维表格应用
    ├── biTableGet/                  # 获取多维表格应用
    ├── biTableUpdate/               # 更新多维表格应用
    ├── dataTableCreate/             # 新增数据表
    ├── dataTableDelete/             # 删除数据表
    ├── dataTableUpdate/             # 更新数据表
    ├── dataTableGetTables/          # 获取所有数据表
    ├── dataTableGetTableFields/     # 获取数据表字段配置
    ├── recordList/                  # 批量获取记录
    ├── recordGet/                   # 获取单个记录
    ├── recordCreate/                # 创建记录
    ├── recordUpdate/                # 更新记录
    └── recordDelete/                # 删除记录
```

## 核心概念

### 飞书多维表格层级结构
```
多维表格应用(Bitable App)
└── 数据表(Table)
    ├── 字段配置(Fields)
    └── 记录(Records)
        └── 字段值(Field Values)
```

**重要区分**：
- **多维表格应用（App）**: 整个多维表格文档，可包含多个数据表
- **数据表（Table）**: 应用中的单个表格，包含字段和记录
- **记录（Record）**: 数据表中的一行数据
- **字段（Field）**: 数据表的列定义

### 标识符格式
- **App Token**: 多维表格应用的唯一标识（格式: `bascXXXX`）
- **Table ID**: 数据表的唯一标识（格式: `tblXXXX`）
- **Record ID**: 记录的唯一标识（格式: `recXXXX`）
- **Field Name/ID**: 字段名称或字段 ID

## 共享配置

### 工具集配置

使用飞书机器人应用的 **App ID** 和 **App Secret** 进行鉴权。

**鉴权方式**：
- 工具集接收 `appId` 和 `appSecret`
- 内部自动换取 `tenant_access_token`
- Token 自动缓存(有效期约2小时,提前5分钟刷新)
- 使用缓存的 token 调用飞书 API

```typescript
secretInputConfig: [
  {
    key: 'appId',
    label: '应用 ID (App ID)',
    description: '飞书机器人应用的 App ID',
    required: true,
    inputType: 'input'
  },
  {
    key: 'appSecret',
    label: '应用密钥 (App Secret)',
    description: '飞书机器人应用的 App Secret',
    required: true,
    inputType: 'secret'
  }
]
```

**鉴权流程**：
```
用户输入 appId + appSecret
    ↓
createFeishuClient(appId, appSecret)
    ↓
getTenantAccessToken(appId, appSecret) [内部自动缓存]
    ↓
创建 Axios 客户端(Bearer Token)
    ↓
调用飞书 Bitable API
```

## 输入输出配置

### 一、表格应用（App）管理工具

#### 1. createTableApp - 新增表格应用

**输入参数:**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| name | string | ✗ | 多维表格名称 |
| folderId | string | ✗ | 文件夹 token，用于指定创建位置 |

**输出参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| appToken | string | 创建的多维表格应用标识 |
| name | string | 多维表格名称 |
| url | string | 多维表格访问链接 |
| success | boolean | 操作是否成功 |

#### 2. deleteTableApp - 删除表格应用

**输入参数:**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| appToken | string | ✓ | 多维表格应用 token |

**输出参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| deleted | boolean | 是否删除成功 |
| appToken | string | 被删除的应用 token |

#### 3. getTableApp - 获取表格应用元数据

**输入参数:**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| appToken | string | ✓ | 多维表格应用 token |

**输出参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| appToken | string | 多维表格应用标识 |
| name | string | 多维表格名称 |
| isAdvanced | boolean | 是否为高级权限 |
| timeZone | string | 时区 |
| metadata | object | 完整元数据 JSON |

#### 4. updateTableApp - 更新表格应用元数据

**输入参数:**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| appToken | string | ✓ | 多维表格应用 token |
| name | string | ✓ | 新的多维表格名称 |

**输出参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| appToken | string | 应用 token |
| name | string | 更新后的名称 |
| success | boolean | 操作是否成功 |

### 二、数据表（Table）管理工具

#### 5. createTable - 新增数据表

**输入参数:**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| appToken | string | ✓ | 多维表格应用 token |
| tableName | string | ✓ | 数据表名称 |

**输出参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| tableId | string | 创建的数据表 ID |
| tableName | string | 数据表名称 |
| defaultViewId | string | 默认视图 ID |
| success | boolean | 操作是否成功 |

#### 6. deleteTable - 删除数据表

**输入参数:**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| appToken | string | ✓ | 多维表格应用 token |
| tableId | string | ✓ | 数据表 ID |

**输出参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| deleted | boolean | 是否删除成功 |
| tableId | string | 被删除的数据表 ID |

#### 7. updateTable - 更新数据表

**输入参数:**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| appToken | string | ✓ | 多维表格应用 token |
| tableId | string | ✓ | 数据表 ID |
| tableName | string | ✓ | 新的数据表名称 |

**输出参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| tableId | string | 数据表 ID |
| tableName | string | 更新后的名称 |
| success | boolean | 操作是否成功 |

#### 8. getTables - 获取所有数据表

**输入参数:**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| appToken | string | ✓ | 多维表格应用 token |
| pageSize | number | ✗ | 每页数量（1-100，默认20） |
| pageToken | string | ✗ | 分页标记 |

**输出参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| tables | array | 数据表列表 |
| total | number | 总数量 |
| hasMore | boolean | 是否有更多 |
| pageToken | string | 下一页标记 |

#### 9. getTableFields - 获取数据表字段配置

**输入参数:**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| appToken | string | ✓ | 多维表格应用 token |
| tableId | string | ✓ | 数据表 ID |
| pageSize | number | ✗ | 每页数量（1-100，默认100） |
| pageToken | string | ✗ | 分页标记 |

**输出参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| fields | array | 字段配置列表 |
| total | number | 字段总数 |
| hasMore | boolean | 是否有更多 |
| fieldNames | array | 字段名称列表 |

### 三、记录（Record）管理工具

#### 10. listRecords - 批量获取记录

**输入参数:**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| appToken | string | ✓ | 多维表格应用 token |
| tableId | string | ✓ | 数据表 ID |
| pageSize | number | ✗ | 每页数量（1-500，默认100） |
| pageToken | string | ✗ | 分页标记 |
| filter | string | ✗ | 筛选条件（JSON格式） |
| sort | string | ✗ | 排序规则（JSON数组格式） |

**输出参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| records | array | 记录列表（JSON数组） |
| total | number | 记录总数 |
| hasMore | boolean | 是否有更多数据 |
| pageToken | string | 下一页标记 |

#### 11. getRecord - 获取单个记录

**输入参数:**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| appToken | string | ✓ | 多维表格应用 token |
| tableId | string | ✓ | 数据表 ID |
| recordId | string | ✓ | 记录 ID |

**输出参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| recordId | string | 记录唯一标识 |
| fields | object | 字段数据（JSON对象） |
| record | object | 完整记录（包含元数据） |

#### 12. createRecord - 创建记录

**输入参数:**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| appToken | string | ✓ | 多维表格应用 token |
| tableId | string | ✓ | 数据表 ID |
| fields | string | ✓ | 字段数据（JSON对象格式） |

**输出参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| recordId | string | 创建的记录 ID |
| fields | object | 创建的字段数据 |
| success | boolean | 操作是否成功 |

#### 13. updateRecord - 更新记录

**输入参数:**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| appToken | string | ✓ | 多维表格应用 token |
| tableId | string | ✓ | 数据表 ID |
| recordId | string | ✓ | 记录 ID |
| fields | string | ✓ | 要更新的字段数据（JSON对象格式） |

**输出参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| recordId | string | 更新的记录 ID |
| fields | object | 更新后的字段数据 |
| success | boolean | 操作是否成功 |

#### 14. deleteRecord - 删除记录

**输入参数:**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| appToken | string | ✓ | 多维表格应用 token |
| tableId | string | ✓ | 数据表 ID |
| recordId | string | ✓ | 记录 ID |

**输出参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| deleted | boolean | 是否删除成功 |
| recordId | string | 被删除的记录 ID |

## 代码示例

### 工具集配置 (config.ts)

```typescript
import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': '飞书多维表格',
    en: 'Feishu Bitable'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '提供飞书多维表格的完整操作功能，包括应用管理、数据表管理、记录 CRUD、字段配置查询',
    en: 'Provides comprehensive Feishu Bitable operations including app management, table management, record CRUD, and field configuration'
  },
  toolDescription: `A comprehensive Feishu (Lark) Bitable toolset for managing multidimensional table apps, tables, records, and fields.
Supports complete CRUD operations across all levels: apps, tables, and records.`,

  icon: 'core/workflow/template/feishu',
  author: 'FastGPT Team',
  courseUrl: 'https://open.feishu.cn/document/server-docs/docs/bitable-v1/bitable-overview',

  // 只共享 accessToken，appToken 作为各工具的输入参数
  secretInputConfig: [
    {
      key: 'accessToken',
      label: '访问凭证 Access Token',
      description: '飞书开放平台的访问令牌 (tenant_access_token 或 user_access_token)',
      required: true,
      inputType: 'secret'
    }
  ]
});
```

### 共享客户端 (client.ts)

```typescript
import axios, { AxiosInstance } from 'axios';

const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';

export interface FeishuResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

/**
 * 创建飞书 API 客户端
 */
export function createFeishuClient(accessToken: string): AxiosInstance {
  const client = axios.create({
    baseURL: FEISHU_API_BASE,
    timeout: 30000,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  // 响应拦截器
  client.interceptors.response.use(
    (response) => {
      const data = response.data as FeishuResponse;
      if (data.code === 0) return response;
      return Promise.reject(new Error(`Feishu API Error [${data.code}]: ${data.msg}`));
    }
  );

  return client;
}
```

### 共享工具函数 (utils.ts)

```typescript
/**
 * 格式化 JSON 输出
 */
export function formatJsonOutput(data: any): string {
  if (typeof data === 'string') return data;
  return JSON.stringify(data, null, 2);
}

/**
 * 解析 JSON 字符串
 */
export function parseJsonSafely(jsonString: string): any {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

/**
 * 构建分页参数
 */
export function buildPaginationParams(pageSize?: number, pageToken?: string) {
  const params: any = {};
  if (pageSize !== undefined && pageSize > 0) {
    params.page_size = pageSize;
  }
  if (pageToken) {
    params.page_token = pageToken;
  }
  return params;
}
```

### 类型定义 (types.ts)

```typescript
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
export interface Record {
  record_id: string;
  fields: Record<string, any>;
  created_time?: number;
  created_by?: { id: string; name: string };
  last_modified_time?: number;
  last_modified_by?: { id: string; name: string };
}

/**
 * 字段配置
 */
export interface Field {
  field_id: string;
  field_name: string;
  type: number;
  property?: any;
  description?: { content: string };
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
```

### 子工具示例 - createTable

```typescript
// children/createTable/config.ts
import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '新增数据表',
    en: 'Create Table'
  },
  description: {
    'zh-CN': '在飞书多维表格应用中创建新的数据表',
    en: 'Create a new data table in Feishu Bitable app'
  },
  toolDescription: 'Create a new data table in a Feishu Bitable application with specified name.',

  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'appToken',
          label: '多维表格应用 Token',
          description: '多维表格应用的唯一标识',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The app token of the Bitable application',
          placeholder: 'bascxxxxxx'
        },
        {
          key: 'tableName',
          label: '数据表名称',
          description: '新建数据表的名称',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The name of the new table to create',
          maxLength: 100
        }
      ],
      outputs: [
        {
          key: 'tableId',
          label: '数据表 ID',
          description: '创建的数据表唯一标识',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'tableName',
          label: '数据表名称',
          description: '数据表名称',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'defaultViewId',
          label: '默认视图 ID',
          description: '默认视图标识',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'success',
          label: '是否成功',
          description: '操作是否成功',
          valueType: WorkflowIOValueTypeEnum.boolean
        }
      ]
    }
  ]
});
```

```typescript
// children/createTable/src/index.ts
import { z } from 'zod';
import { createFeishuClient } from '../../../client';
import type { FeishuResponse, Table } from '../../../types';

export const InputType = z.object({
  accessToken: z.string().min(1, 'Access Token is required'),
  appToken: z.string().min(1, 'App Token is required'),
  tableName: z.string().min(1, 'Table name cannot be empty').max(100, 'Table name too long')
});

export const OutputType = z.object({
  tableId: z.string(),
  tableName: z.string(),
  defaultViewId: z.string().optional(),
  success: z.boolean()
});

export async function tool({
  accessToken,
  appToken,
  tableName
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
    const client = createFeishuClient(accessToken);

    const response = await client.post<FeishuResponse<{ table: Table }>>(
      `/bitable/v1/apps/${appToken}/tables`,
      { table: { name: tableName } }
    );

    const table = response.data.data.table;

    return {
      tableId: table.table_id,
      tableName: table.name,
      defaultViewId: table.default_view_id,
      success: true
    };
}
```

## 测试示例

### 测试配置
所有测试使用以下配置:
```typescript
const testConfig = {
  appId: 'cli_a63d8c11cd3f900b',
  appSecret: 'QLtqX9bO1Et9fqI4608fPPsMIVf6ra0A'
};
```

### 测试文件列表
1. **BiTable CRU 测试** (`test/biTableCRU.test.ts`) - 测试多维表格的创建、获取、更新操作
   - ⚠️ 注意: 飞书不提供删除多维表格的 API,测试后需手动清理
2. **DataTable CRUD 测试** (`test/dataTableCRUD.test.ts`) - 测试数据表的完整 CRUD 和字段获取
3. **Record CRUD 测试** (`test/recordCRUD.test.ts`) - 测试记录的完整 CRUD 和列表查询

### 运行测试
```bash
# 运行所有测试
npm test

# 运行单个测试文件
npm test test/biTableCRU.test.ts
npm test test/dataTableCRUD.test.ts
npm test test/recordCRUD.test.ts
```

## 可能存在的问题和重点检查内容

### 1. 认证相关
- **Access Token 时效**: 飞书 access_token 有效期约 2 小时，需注意刷新机制
- **权限范围**: 确保 access_token 具有操作多维表格的权限（需要申请 bitable 相关权限）
- **Token 类型**: 区分 tenant_access_token（租户级别）和 user_access_token（用户级别）

### 2. API 限制
- **频率限制**: 飞书 API 有频率限制，需要处理 429 错误并实现重试机制
- **数据量限制**:
  - 单次查询最多返回 500 条记录
  - 批量操作有数量限制
  - 字段数量有上限

### 3. 层级关系理解
- **App vs Table**: 明确区分多维表格应用（App）和数据表（Table）
- **操作范围**: 不同操作需要不同层级的标识符
- **资源依赖**: 删除应用会删除所有数据表和记录

### 4. 数据类型处理
- **字段类型映射**: 飞书多维表格有多种字段类型（文本、数字、日期、附件等），需要正确处理
- **JSON 序列化**: fields 参数需要正确序列化和反序列化
- **特殊字符**: 字段名可能包含特殊字符，需要适当转义

### 5. 错误处理
- **网络超时**: 设置合理的超时时间（建议 30 秒）
- **部分失败**: 批量操作可能部分成功，需要返回详细的错误信息
- **错误码映射**: 飞书 API 返回的错误码需要映射为用户友好的错误信息

### 6. 性能优化
- **分页策略**: 大数据量查询需要实现分页机制
- **并发控制**: 批量操作时需要控制并发数，避免触发频率限制
- **缓存策略**: 字段配置等元数据可以考虑缓存

### 7. 测试要点
- **Mock API**: 单元测试应 mock 飞书 API 调用
- **环境变量**: 集成测试需要配置有效的测试凭证
- **清理机制**: 测试后需要清理创建的测试数据
- **边界条件**: 测试空数据、最大数据量、特殊字符等场景

### 8. 安全性
- **Token 存储**: accessToken 和 appToken 应该安全存储，不应明文记录在日志中
- **输入验证**: 所有用户输入都需要严格验证，防止注入攻击
- **权限控制**: 确保用户只能操作有权限的资源

## 开发流程检查清单

- [ ] 完成工具集配置文件编写（config.ts）
- [ ] 实现共享模块（client.ts, utils.ts, types.ts）
- [ ] 实现表格应用管理工具（4个）
- [ ] 实现数据表管理工具（5个）
- [ ] 实现记录管理工具（5个）
- [ ] 编写完整的单元测试
- [ ] 编写集成测试
- [ ] 通过所有测试用例
- [ ] 检查 TypeScript 类型错误
- [ ] 测试实际 API 调用（需要有效的飞书凭证）
- [ ] 验证错误处理机制
- [ ] 检查性能和并发控制
- [ ] 更新文档和示例
- [ ] 生产环境验证
