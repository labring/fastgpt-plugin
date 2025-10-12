# FastGPT Plugin 工具设计规范

本文档定义了 FastGPT Plugin 系统中工具(Tool)和工具集(ToolSet)的统一设计规范,基于 Redis 工具集的最佳实践总结。

---

## 目录

- [1. 概述](#1-概述)
- [2. 工具类型](#2-工具类型)
- [3. 目录结构](#3-目录结构)
- [4. 工具(Tool)设计](#4-工具tool设计)
- [5. 工具集(ToolSet)设计](#5-工具集toolset设计)
- [6. 共享模块设计](#6-共享模块设计)
- [7. 配置规范](#7-配置规范)
- [8. 业务逻辑实现](#8-业务逻辑实现)
- [9. 错误处理](#9-错误处理)
- [10. 测试规范](#10-测试规范)
- [11. 依赖管理](#11-依赖管理)
- [12. 最佳实践](#12-最佳实践)

---

## 1. 概述

### 1.1 设计原则

- **关注点分离**: 配置、逻辑、工具代码分离
- **类型安全**: 使用 Zod 进行输入输出验证 + TypeScript 类型推导
- **配置共享**: 工具集中的子工具共享父级配置
- **单一职责**: 每个工具专注单一功能
- **可扩展性**: 易于添加新工具和功能
- **一致性**: 统一的命名、结构、错误处理模式

### 1.2 核心概念

**Tool(工具)**
- 独立的功能单元
- 有明确的输入输出
- 可直接使用或作为工具集的子工具

**ToolSet(工具集)**
- 相关工具的集合
- 共享配置(如 API Key、连接串)
- 提供统一的管理界面

---

## 2. 工具类型

参考 ToolTypeEnum 枚举变量值。

---

## 3. 目录结构

### 3.1 独立工具结构

```
modules/tool/packages/toolName/
├── index.ts                 # 工具导出主文件
├── config.ts                # 工具配置文件
├── package.json             # 依赖管理
├── src/
│   └── index.ts             # 业务逻辑实现
└── test/
    └── index.test.ts        # 单元测试
```

**示例**: `fetchUrl`, `delay`, `getTime`

### 3.2 工具集结构

```
modules/tool/packages/toolsetName/
├── index.ts                          # 工具集导出主文件
├── config.ts                         # 工具集配置文件
├── package.json                      # 依赖管理
├── client.ts                         # 共享连接/客户端逻辑(可选)
├── utils.ts                          # 共享工具函数(可选)
└── children/                         # 子工具目录
    ├── tool1/                        # 子工具1
    │   ├── index.ts                  # 子工具导出
    │   ├── config.ts                 # 子工具配置
    │   ├── src/
    │   │   └── index.ts              # 业务逻辑
    │   └── test/
    │       └── index.test.ts         # 单元测试
    ├── tool2/                        # 子工具2
    │   ├── index.ts
    │   ├── config.ts
    │   ├── src/
    │   │   └── index.ts
    │   └── test/
    │       └── index.test.ts
    └── tool3/                        # 子工具3
        └── ...
```

**示例**: `redis`, `arxiv`, `duckduckgo`

---

## 4. 工具(Tool)设计

### 4.1 配置文件 (config.ts)

具体配置值可参考 `ToolConfigType`

```typescript
import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  // 可选配置
  isWorkerRun: false,                    // 是否在 worker 中运行(默认 true)
  type: ToolTypeEnum.tools,              // 工具类型
  icon: 'core/workflow/template/xxx',    // 图标路径
  author: 'Your Name',                   // 作者
  courseUrl: 'https://...',              // 文档链接

  // 必需配置
  name: {
    'zh-CN': '工具名称',
    en: 'Tool Name'
  },
  description: {
    'zh-CN': '工具描述',
    en: 'Tool Description'
  },
  toolDescription: 'Description for AI to understand how to use this tool', // 给模型的描述

  // 密钥配置(可选)
  secretInputConfig: [
    {
      key: 'apiKey',
      label: 'API Key',
      description: 'Your API key',
      required: true,
      inputType: 'secret'
    }
  ],

  // 版本列表
  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'inputKey',
          label: '输入名称',
          description: '输入描述',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Input description for AI', // 可选，当该变量需要由 LLM 模型动态生成时才存在
          defaultValue: 'default value',           // 可选
          placeholder: 'Enter value...',           // 可选
          maxLength: 1000                          // 可选,字符串最大长度
        }
      ],
      outputs: [
        {
          key: 'outputKey',
          label: '输出名称',
          description: '输出描述',
          valueType: WorkflowIOValueTypeEnum.string
        }
      ]
    }
  ]
});
```

### 4.2 业务逻辑 (src/index.ts)

```typescript
import { z } from 'zod';

// 输入类型定义
export const InputType = z.object({
  // 如果有 secretInputConfig,需要包含密钥字段
  apiKey: z.string().optional(),

  // 工具的输入参数
  inputKey: z.string().min(1, 'Input cannot be empty')
});

// 输出类型定义
export const OutputType = z.object({
  outputKey: z.string(),
  success: z.boolean()
});

// 工具回调函数
export async function tool({
  apiKey,
  inputKey
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    // 业务逻辑实现
    const result = await performOperation(inputKey, apiKey);

    return {
      outputKey: result,
      success: true
    };

  } catch (error) {
    // 错误处理
    return Promise.reject(handleError(error));
  }
}

// 错误处理函数
function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error occurred';
}
```

### 4.3 导出文件 (index.ts)

```typescript
import config from './config';
import { InputType, OutputType, tool as toolCb } from './src';
import { exportTool } from '@tool/utils/tool';

export default exportTool({
  toolCb,
  InputType,
  OutputType,
  config
});
```

---

## 5. 工具集(ToolSet)设计

### 5.1 工具集配置 (config.ts)

具体配置可参考 `ToolSetConfigType`

```typescript
import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  // 必需配置
  name: {
    'zh-CN': '工具集名称',
    en: 'ToolSet Name'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '工具集描述',
    en: 'ToolSet Description'
  },
  toolDescription: 'Description for AI to understand this toolset',

  // 可选配置
  icon: 'core/workflow/template/xxx',
  author: 'Your Name',
  courseUrl: 'https://...',

  // 共享密钥配置 - 所有子工具共享
  secretInputConfig: [
    {
      key: 'connectionString',
      label: '连接串',
      description: '服务连接地址',
      required: true,
      inputType: 'secret'
    },
    {
      key: 'apiKey',
      label: 'API Key',
      description: 'API 访问密钥',
      required: false,
      inputType: 'secret'
    }
  ]
});
```

### 5.2 子工具配置 (children/toolName/config.ts)

```typescript
import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '子工具名称',
    en: 'Child Tool Name'
  },
  description: {
    'zh-CN': '子工具描述',
    en: 'Child Tool Description'
  },
  toolDescription: 'Description for AI',

  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'param1',
          label: '参数1',
          description: '参数描述',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Parameter description for AI'
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '结果',
          description: '返回结果',
          valueType: WorkflowIOValueTypeEnum.string
        }
      ]
    }
  ]
});
```

### 5.3 子工具业务逻辑 (children/toolName/src/index.ts)

```typescript
import { z } from 'zod';
import { createClient, handleError } from '../../../client'; // 使用共享模块

// 输入类型 - 包含父级密钥
export const InputType = z.object({
  // 父级共享的密钥
  connectionString: z.string().min(1, 'Connection string is required'),
  apiKey: z.string().optional(),

  // 子工具的特定参数
  param1: z.string().min(1, 'Parameter cannot be empty')
});

// 输出类型
export const OutputType = z.object({
  result: z.string(),
  success: z.boolean()
});

// 工具回调函数
export async function tool({
  connectionString,
  apiKey,
  param1
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  let client = null;

  try {
    // 使用共享的客户端创建逻辑
    client = await createClient(connectionString, apiKey);

    // 执行业务逻辑
    const result = await client.operation(param1);

    return {
      result,
      success: true
    };

  } catch (error) {
    // 使用共享的错误处理
    return Promise.reject(handleError(error));

  } finally {
    // 清理资源
    if (client) {
      await client.close();
    }
  }
}
```

### 5.4 子工具导出 (children/toolName/index.ts)

```typescript
import config from './config';
import { InputType, OutputType, tool as toolCb } from './src';
import { exportTool } from '@tool/utils/tool';

export default exportTool({
  toolCb,
  InputType,
  OutputType,
  config
});
```

### 5.5 工具集导出 (index.ts)

```typescript
import config from './config';
import { exportToolSet } from '@tool/utils/tool';

export default exportToolSet({
  config
});
```

---

## 6. 共享模块设计

### 6.1 客户端模块 (client.ts)

用于工具集中的子工具共享连接逻辑。

```typescript
import SomeClient from 'some-library';

/**
 * 创建客户端连接
 */
export async function createClient(
  connectionString: string,
  apiKey?: string
): Promise<SomeClient> {
  const client = new SomeClient(connectionString, {
    apiKey,
    retryStrategy: (times: number) => {
      if (times > 3) {
        return null; // 停止重试
      }
      return Math.min(times * 200, 2000); // 重试间隔
    },
    connectTimeout: 10000,  // 10 秒连接超时
    commandTimeout: 5000,   // 5 秒命令超时
    lazyConnect: true
  });

  // 测试连接
  await client.connect();
  await client.ping();

  return client;
}

/**
 * 统一错误处理
 */
export function handleError(error: unknown): string {
  let errorMessage = 'Unknown error occurred';

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  // 区分具体错误类型
  if (errorMessage.includes('ECONNREFUSED')) {
    return 'Connection refused. Please check connection string and ensure service is running.';
  } else if (errorMessage.includes('ETIMEDOUT')) {
    return 'Connection timeout. Please check network and service availability.';
  } else if (errorMessage.includes('AUTH')) {
    return 'Authentication failed. Please check credentials.';
  }

  return errorMessage;
}
```

### 6.2 工具函数模块 (utils.ts)

```typescript
/**
 * 数据验证
 */
export function validateInput(input: string, maxLength?: number): boolean {
  if (!input || input.trim().length === 0) {
    return false;
  }
  if (maxLength && input.length > maxLength) {
    return false;
  }
  return true;
}

/**
 * 数据格式化
 */
export function formatOutput(data: any): string {
  if (typeof data === 'string') {
    return data;
  }
  return JSON.stringify(data, null, 2);
}

/**
 * 超时包装
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}
```

---

## 7. 配置规范

### 7.1 命名规范

**工具/工具集名称**
- 使用 camelCase: `fetchUrl`, `redisCache`, `githubTools`
- 简洁描述功能: 避免冗长名称
- 保持一致性: 同类工具使用相似模式

**配置键名**
- 使用 camelCase: `apiKey`, `connectionString`, `maxRetries`
- 见名知意: 清楚表达配置用途
- 避免缩写: 除非是通用缩写(如 `url`, `id`)

### 7.2 输入配置 (inputs)

#### 7.2.1 基本属性

| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `key` | string | ✓ | 参数唯一标识符 |
| `label` | string | ✓ | 显示标签 |
| `description` | string | | 详细描述 |
| `required` | boolean | | 是否必填 |
| `valueType` | WorkflowIOValueTypeEnum | ✓ | 值类型 |
| `renderTypeList` | FlowNodeInputTypeEnum[] | ✓ | 渲染类型列表 |
| `toolDescription` | string | | **AI 理解用的描述** |
| `defaultValue` | any | | 默认值 |

**重要**: `toolDescription` 只在需要 AI 动态理解的字段设置,人工配置的参数不需要该字段。

#### 7.2.2 值类型 (WorkflowIOValueTypeEnum)

| 类型 | 说明 | 使用场景 |
|------|------|----------|
| `string` | 字符串 | 文本、URL、键名 |
| `number` | 数字 | 计数、时长、大小 |
| `boolean` | 布尔值 | 开关、标志 |
| `object` | 对象 | JSON 数据、配置 |
| `arrayString` | 字符串数组 | 标签、列表 |
| `arrayNumber` | 数字数组 | 数值列表 |
| `arrayObject` | 对象数组 | 复杂数据集 |
| `any` | 任意类型 | 灵活参数 |

#### 7.2.3 渲染类型 (FlowNodeInputTypeEnum)

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| `input` | 单行输入 | 短文本、URL、键名 |
| `textarea` | 多行文本 | 长文本、JSON、内容 |
| `numberInput` | 数字输入 | 数值、时长、大小 |
| `switch` | 开关 | 布尔值 |
| `select` | 单选 | 枚举值、选项 |
| `multipleSelect` | 多选 | 多个选项 |
| `reference` | 引用其他节点 | 动态数据流 |
| `JSONEditor` | JSON 编辑器 | 复杂对象 |

#### 7.2.4 常用组合

**文本输入**
```typescript
{
  key: 'text',
  label: '文本',
  valueType: WorkflowIOValueTypeEnum.string,
  renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
  required: true,
  toolDescription: 'The text content to process'  // AI 使用的描述
}
```

**数字输入**
```typescript
{
  key: 'count',
  label: '数量',
  valueType: WorkflowIOValueTypeEnum.number,
  renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
  defaultValue: 10,
  max: 100,
  min: 1,
  toolDescription: 'The number of items to process'
}
```

**开关**
```typescript
{
  key: 'enabled',
  label: '启用',
  valueType: WorkflowIOValueTypeEnum.boolean,
  renderTypeList: [FlowNodeInputTypeEnum.switch],
  defaultValue: true
  // 注意: 开关通常不需要 toolDescription,因为是人工配置
}
```

**选择器**
```typescript
{
  key: 'format',
  label: '格式',
  valueType: WorkflowIOValueTypeEnum.string,
  renderTypeList: [FlowNodeInputTypeEnum.select],
  list: [
    { label: 'JSON', value: 'json' },
    { label: 'XML', value: 'xml' },
    { label: 'YAML', value: 'yaml' }
  ],
  defaultValue: 'json'
  // 注意: 选择器通常不需要 toolDescription
}
```

### 7.3 输出配置 (outputs)

| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `key` | string | ✓ | 输出唯一标识符 |
| `label` | string | ✓ | 显示标签 |
| `description` | string | | 详细描述 |
| `valueType` | WorkflowIOValueTypeEnum | ✓ | 值类型 |

**示例**
```typescript
outputs: [
  {
    key: 'result',
    label: '结果',
    description: '操作返回的数据',
    valueType: WorkflowIOValueTypeEnum.string
  },
  {
    key: 'success',
    label: '是否成功',
    description: '操作是否成功执行',
    valueType: WorkflowIOValueTypeEnum.boolean
  },
  {
    key: 'metadata',
    label: '元数据',
    description: '额外的元数据信息',
    valueType: WorkflowIOValueTypeEnum.object
  }
]
```

### 7.4 密钥配置 (secretInputConfig)

用于敏感信息(API Key, 连接串等)。

| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `key` | string | ✓ | 密钥标识符 |
| `label` | string | ✓ | 显示标签 |
| `description` | string | | 详细描述 |
| `required` | boolean | | 是否必填 |
| `inputType` | 'secret' | ✓ | 必须为 'secret' |

**示例**
```typescript
secretInputConfig: [
  {
    key: 'apiKey',
    label: 'API Key',
    description: 'Your API key from the service provider',
    required: true,
    inputType: 'secret'
  },
  {
    key: 'apiSecret',
    label: 'API Secret',
    description: 'Your API secret (optional)',
    required: false,
    inputType: 'secret'
  }
]
```

---

## 8. 业务逻辑实现

### 8.1 代码规范

- **多行字符串**: 使用 `` (模板字符串) 来表示多行字符串

### 8.2 输入验证

```typescript
import { z } from 'zod';

export const InputType = z.object({
  // 字符串验证
  name: z.string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name too long'),

  // 数字验证
  count: z.number()
    .int('Must be an integer')
    .min(1, 'Must be positive')
    .max(1000, 'Too large'),

  // 布尔验证
  enabled: z.boolean(),

  // 枚举验证
  format: z.enum(['json', 'xml', 'yaml']),

  // URL 验证
  url: z.string().url('Invalid URL format'),

  // 邮箱验证
  email: z.string().email('Invalid email format'),

  // 可选字段
  optional: z.string().optional(),

  // 带默认值
  timeout: z.number().default(5000),

  // 对象验证
  config: z.object({
    host: z.string(),
    port: z.number()
  }),

  // 数组验证
  tags: z.array(z.string()),

  // 自定义验证
  customField: z.string().refine(
    (val) => val.startsWith('prefix_'),
    { message: 'Must start with prefix_' }
  )
});
```

### 8.3 异步操作

```typescript
export async function tool(input: z.infer<typeof InputType>) {
  // 超时控制
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Operation timed out')), 10000)
  );

  const operationPromise = async () => {
    // 执行操作
    const result = await performOperation(input);
    return result;
  };

  try {
    const result = await Promise.race([operationPromise(), timeoutPromise]);
    return { result, success: true };
  } catch (error) {
    return Promise.reject(handleError(error));
  }
}
```

### 8.4 资源管理

```typescript
export async function tool(input: z.infer<typeof InputType>) {
  let client = null;
  let file = null;

  try {
    // 获取资源
    client = await createClient(input.connectionString);
    file = await openFile(input.filePath);

    // 使用资源
    const result = await processData(client, file);

    return { result, success: true };

  } catch (error) {
    return Promise.reject(handleError(error));

  } finally {
    // 确保资源释放
    if (client) {
      await client.close().catch(console.error);
    }
    if (file) {
      await file.close().catch(console.error);
    }
  }
}
```

### 8.5 并发控制

```typescript
import pLimit from 'p-limit';

export async function tool(input: z.infer<typeof InputType>) {
  const limit = pLimit(5); // 最多5个并发

  const tasks = input.items.map(item =>
    limit(() => processItem(item))
  );

  try {
    const results = await Promise.all(tasks);
    return { results, success: true };
  } catch (error) {
    return Promise.reject(handleError(error));
  }
}
```

---

## 9. 错误处理

### 9.1 错误分类

```typescript
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  CONNECTION = 'CONNECTION_ERROR',
  TIMEOUT = 'TIMEOUT_ERROR',
  AUTH = 'AUTH_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  INTERNAL = 'INTERNAL_ERROR'
}

export class ToolError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ToolError';
  }
}
```

### 9.2 错误处理函数

```typescript
export function handleError(error: unknown): string {
  // 已知的工具错误
  if (error instanceof ToolError) {
    return `[${error.type}] ${error.message}`;
  }

  // JavaScript Error
  if (error instanceof Error) {
    const message = error.message;

    // 网络错误
    if (message.includes('ECONNREFUSED')) {
      return 'Connection refused. Please check the service is running.';
    }
    if (message.includes('ETIMEDOUT')) {
      return 'Connection timeout. Please check network connectivity.';
    }
    if (message.includes('ENOTFOUND')) {
      return 'Host not found. Please check the URL.';
    }

    // 认证错误
    if (message.includes('401') || message.includes('Unauthorized')) {
      return 'Authentication failed. Please check your credentials.';
    }
    if (message.includes('403') || message.includes('Forbidden')) {
      return 'Access forbidden. Please check your permissions.';
    }

    // 资源错误
    if (message.includes('404') || message.includes('Not Found')) {
      return 'Resource not found.';
    }

    // 速率限制
    if (message.includes('429') || message.includes('Rate Limit')) {
      return 'Rate limit exceeded. Please try again later.';
    }

    // 服务器错误
    if (message.includes('500') || message.includes('Internal Server Error')) {
      return 'Server error. Please try again later.';
    }

    return error.message;
  }

  // 字符串错误
  if (typeof error === 'string') {
    return error;
  }

  // 未知错误
  return 'An unknown error occurred';
}
```

### 9.3 错误重试

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // 某些错误不需要重试
      if (isNonRetryableError(error)) {
        throw error;
      }

      // 最后一次重试失败
      if (i === maxRetries - 1) {
        break;
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
    }
  }

  throw lastError!;
}

function isNonRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message;
    return (
      message.includes('401') ||
      message.includes('403') ||
      message.includes('404') ||
      message.includes('Invalid')
    );
  }
  return false;
}
```

---

## 10. 测试规范

### 10.1 单元测试结构

```typescript
// test/index.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { tool } from '../src';

describe('ToolName Tests', () => {
  // 测试准备
  beforeAll(async () => {
    // 设置测试环境
  });

  // 测试清理
  afterAll(async () => {
    // 清理测试环境
  });

  describe('Input Validation', () => {
    it('should reject empty input', async () => {
      await expect(tool({ input: '' })).rejects.toThrow();
    });

    it('should accept valid input', async () => {
      const result = await tool({ input: 'valid' });
      expect(result.success).toBe(true);
    });
  });

  describe('Business Logic', () => {
    it('should perform operation correctly', async () => {
      const result = await tool({ input: 'test' });
      expect(result).toMatchObject({
        output: expect.any(String),
        success: true
      });
    });

    it('should handle edge cases', async () => {
      // 测试边界情况
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', async () => {
      await expect(tool({ input: 'invalid' })).rejects.toThrow();
    });
  });
});
```

### 10.2 测试最佳实践

- **独立性**: 每个测试独立,不依赖其他测试
- **覆盖率**: 覆盖正常流程、边界情况、错误处理
- **可重复**: 测试结果应该可重复,不依赖外部状态
- **快速**: 单元测试应快速执行
- **清晰**: 测试名称清楚描述测试内容

---

## 11. 依赖管理

### 11.1 package.json 模板

```json
{
  "name": "@tool/toolName",
  "version": "0.1.0",
  "description": "Tool description",
  "main": "index.ts",
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  },
  "dependencies": {
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "vitest": "^1.0.0"
  }
}
```

### 11.2 依赖选择原则

- **最小化**: 只添加必需的依赖
- **稳定性**: 选择稳定、维护良好的库
- **大小**: 考虑包大小,避免过大的依赖
- **类型支持**: 优先选择有 TypeScript 类型的库
- **版本管理**: 使用 `^` 允许小版本更新

---

## 12. 代码规范

* 采用小驼峰命名规范。

## 13. 工具开发流程

所有新工具，均参考该示例进行设计和开发。

### 1. 编写设计文件

示例如下：

```
# xxx 设计文档

## 功能描述

* 需要一个 tool/toolset
* 如果是 toolset，需要列举出需要哪些子工具

## 参考文档

API 文档，官方教程等。

## 工具目录结构

## 输入输出配置

## 代码示例

## 测试示例

## 可能存在的问题和重点检查内容
```

### 2. 参考示例文档进行开发测试

### 3. 运行验证

1. 检查测试案例是否通过
2. 检查 TS 是否有错误
3. 检查是否可以正常运行和build