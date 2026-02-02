# Redis 缓存工具集开发文档

## 概述

本文档详细描述如何在 FastGPT Plugin 系统中开发一个 Redis 缓存工具集。该工具集包含 3 个子工具,共享统一的 Redis 连接配置,提供简洁的缓存操作能力。

## 工具集架构

### 目录结构

```
modules/tool/packages/redis/
├── index.ts                          # 工具集导出主文件
├── config.ts                         # 工具集配置文件
├── package.json                      # 依赖管理
├── client.ts                         # 共享 Redis 连接逻辑
└── children/                         # 子工具目录
    ├── get/                          # 获取缓存工具
    │   ├── index.ts                  # 工具导出
    │   ├── config.ts                 # 工具配置
    │   ├── src/
    │   │   └── index.ts              # 业务逻辑
    │   └── test/
    │       └── index.test.ts         # 单元测试
    ├── set/                          # 设置缓存工具
    │   ├── index.ts
    │   ├── config.ts
    │   ├── src/
    │   │   └── index.ts
    │   └── test/
    │       └── index.test.ts
    └── del/                          # 删除缓存工具
        ├── index.ts
        ├── config.ts
        ├── src/
        │   └── index.ts
        └── test/
            └── index.test.ts
```

### 架构设计原则

1. **工具集模式**: 使用 ToolSet 统一管理相关工具,共享配置
2. **关注点分离**: 每个子工具独立实现,职责单一
3. **类型安全**: 使用 Zod 进行输入输出验证
4. **配置共享**: 所有子工具共享父级的 Redis 连接串

---

## 工具集配置 (config.ts)

### 父级配置 - 工具集元数据

```typescript
import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: {
    'zh-CN': 'Redis 缓存',
    en: 'Redis Cache'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '提供 Redis 缓存的基本操作功能,包括获取、设置和删除',
    en: 'Provides basic Redis cache operations including get, set and delete'
  },
  toolDescription:
    'A Redis caching toolset with GET, SET, DELETE operations. Use these tools to manage cached data in Redis with TTL support.',

  // 共享密钥配置 - 所有子工具共享
  secretInputConfig: [
    {
      key: 'redisUrl',
      label: 'Redis 连接串',
      description: 'Redis 连接地址 (格式: redis://host:port 或 redis://user:password@host:port/db)',
      required: true,
      inputType: 'secret'
    }
  ]
});
```

### 配置说明

#### 工具集特点
- **统一配置**: 只需配置一次 Redis 连接串,所有子工具共享
- **简洁设计**: 每个子工具专注单一操作,接口清晰
- **易于扩展**: 新增子工具只需在 children 目录下创建

#### 共享密钥 (secretInputConfig)
- **redisUrl**: Redis 连接串,支持多种格式
  - 基本格式: `redis://localhost:6379`
  - 带认证: `redis://user:password@localhost:6379`
  - 指定数据库: `redis://localhost:6379/0`
  - 云服务: `redis://xxx.redis.cache.amazonaws.com:6379`

---

## 子工具配置

### 1. GET 工具 (children/get/config.ts)

```typescript
import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '获取缓存',
    en: 'Get Cache'
  },
  description: {
    'zh-CN': '从 Redis 获取缓存数据',
    en: 'Get cached data from Redis'
  },
  toolDescription: 'Get cached value from Redis by key. Returns null if key does not exist.',

  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'key',
          label: '缓存键',
          description: 'Redis 键名',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The Redis key to retrieve'
        }
      ],
      outputs: [
        {
          key: 'value',
          label: '缓存值',
          description: '获取到的缓存数据,如果键不存在则为 null',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'exists',
          label: '是否存在',
          description: '键是否存在',
          valueType: WorkflowIOValueTypeEnum.boolean
        }
      ]
    }
  ]
});
```

### 2. SET 工具 (children/set/config.ts)

```typescript
import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '设置缓存',
    en: 'Set Cache'
  },
  description: {
    'zh-CN': '设置 Redis 缓存数据,支持过期时间',
    en: 'Set Redis cache data with optional TTL'
  },
  toolDescription: 'Set a value in Redis with optional expiration time (TTL in seconds).',

  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'key',
          label: '缓存键',
          description: 'Redis 键名',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The Redis key to set'
        },
        {
          key: 'value',
          label: '缓存值',
          description: '要存储的数据',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The value to cache'
        },
        {
          key: 'ttl',
          label: '过期时间 (秒)',
          description: '数据过期时间,单位秒。0 表示永不过期',
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 0,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference]
        }
      ],
      outputs: [
        {
          key: 'success',
          label: '设置成功',
          description: '是否成功设置',
          valueType: WorkflowIOValueTypeEnum.boolean
        }
      ]
    }
  ]
});
```

### 3. DELETE 工具 (children/del/config.ts)

```typescript
import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '删除缓存',
    en: 'Delete Cache'
  },
  description: {
    'zh-CN': '从 Redis 删除缓存数据',
    en: 'Delete cached data from Redis'
  },
  toolDescription: 'Delete a key and its value from Redis.',

  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'key',
          label: '缓存键',
          description: 'Redis 键名',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The Redis key to delete'
        }
      ],
      outputs: [
        {
          key: 'deleted',
          label: '是否删除',
          description: '键是否被删除 (如果键不存在则为 false)',
          valueType: WorkflowIOValueTypeEnum.boolean
        }
      ]
    }
  ]
});
```

---

## 共享连接模块 (client.ts)

### Redis 连接管理

```typescript
import Redis from 'ioredis';

/**
 * 创建 Redis 客户端连接
 */
export async function createRedisClient(redisUrl: string): Promise<Redis> {
  const client = new Redis(redisUrl, {
    retryStrategy: (times: number) => {
      if (times > 3) {
        return null; // 停止重试
      }
      return Math.min(times * 200, 2000); // 重试间隔
    },
    connectTimeout: 10000, // 10 秒连接超时
    commandTimeout: 5000,  // 5 秒命令超时
    lazyConnect: true
  });

  // 测试连接
  await client.connect();
  await client.ping();

  return client;
}

/**
 * 错误处理
 */
export function handleRedisError(error: unknown): string {
  let errorMessage = 'Unknown error occurred';

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  // 区分错误类型
  if (errorMessage.includes('ECONNREFUSED')) {
    return 'Redis connection refused. Please check Redis URL and ensure Redis is running.';
  } else if (errorMessage.includes('ETIMEDOUT')) {
    return 'Redis connection timeout. Please check network and Redis availability.';
  } else if (errorMessage.includes('NOAUTH')) {
    return 'Redis authentication failed. Please check connection string.';
  }

  return errorMessage;
}
```

---

## 子工具业务逻辑

### 1. GET 工具 (children/get/src/index.ts)

```typescript
import { z } from 'zod';
import { createRedisClient, handleRedisError } from '../../../client';

// 输入类型 (包含父级密钥)
export const InputType = z.object({
  redisUrl: z.string().url('Invalid Redis URL format'),
  key: z.string().min(1, 'Key cannot be empty')
});

// 输出类型
export const OutputType = z.object({
  value: z.string().nullable(),
  exists: z.boolean()
});

export async function tool({
  redisUrl,
  key
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  let client = null;

  try {
    client = await createRedisClient(redisUrl);
    const value = await client.get(key);

    return {
      value,
      exists: value !== null
    };

  } catch (error) {
    return Promise.reject(handleRedisError(error));

  } finally {
    if (client) {
      await client.quit();
    }
  }
}
```

### 2. SET 工具 (children/set/src/index.ts)

```typescript
import { z } from 'zod';
import { createRedisClient, handleRedisError } from '../../../client';

// 输入类型 (包含父级密钥)
export const InputType = z.object({
  redisUrl: z.string().url('Invalid Redis URL format'),
  key: z.string().min(1, 'Key cannot be empty'),
  value: z.string(),
  ttl: z.number().int().min(0).default(0)
});

// 输出类型
export const OutputType = z.object({
  success: z.boolean()
});

export async function tool({
  redisUrl,
  key,
  value,
  ttl
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  let client = null;

  try {
    client = await createRedisClient(redisUrl);

    if (ttl > 0) {
      // 带过期时间的 SET
      await client.setex(key, ttl, value);
    } else {
      // 永久 SET
      await client.set(key, value);
    }

    return { success: true };

  } catch (error) {
    return Promise.reject(handleRedisError(error));

  } finally {
    if (client) {
      await client.quit();
    }
  }
}
```

### 3. DELETE 工具 (children/del/src/index.ts)

```typescript
import { z } from 'zod';
import { createRedisClient, handleRedisError } from '../../../client';

// 输入类型 (包含父级密钥)
export const InputType = z.object({
  redisUrl: z.string().url('Invalid Redis URL format'),
  key: z.string().min(1, 'Key cannot be empty')
});

// 输出类型
export const OutputType = z.object({
  deleted: z.boolean()
});

export async function tool({
  redisUrl,
  key
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  let client = null;

  try {
    client = await createRedisClient(redisUrl);
    const count = await client.del(key);

    return {
      deleted: count > 0
    };

  } catch (error) {
    return Promise.reject(handleRedisError(error));

  } finally {
    if (client) {
      await client.quit();
    }
  }
}
```

---

## 导出配置

### 工具集导出 (index.ts)

```typescript
import config from './config';
import { exportToolSet } from '@tool/utils/tool';

export default exportToolSet({
  config
});
```

### 子工具导出

每个子工具使用标准的导出模式:

**children/get/index.ts**
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

**children/set/index.ts** 和 **children/del/index.ts** 结构相同。

---

## 依赖管理 (package.json)

```json
{
  "name": "@tool/redis",
  "version": "0.1.0",
  "description": "Redis cache toolset for FastGPT Plugin",
  "main": "index.ts",
  "scripts": {
    "test": "vitest"
  },
  "dependencies": {
    "ioredis": "^5.3.2",
    "zod": "^3.25.76"
  },
  "peerDependencies": {
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/bun": "latest"
  }
}
```

---

## 使用指南

### 配置工具集

在 FastGPT 中首次使用时,只需配置一次 Redis 连接串:

```
Redis 连接串: redis://localhost:6379
```

或带认证:
```
Redis 连接串: redis://user:password@localhost:6379/0
```

### 基本使用

#### 1. GET - 获取缓存

**输入**:
- `key`: `user:1000:profile`

**输出**:
- `value`: `{"name": "Alice", "age": 30}` 或 `null`
- `exists`: `true` 或 `false`

#### 2. SET - 设置缓存

**输入**:
- `key`: `user:1000:profile`
- `value`: `{"name": "Alice", "age": 30}`
- `ttl`: `3600` (1小时后过期)

**输出**:
- `success`: `true`

#### 3. DELETE - 删除缓存

**输入**:
- `key`: `user:1000:profile`

**输出**:
- `deleted`: `true` (删除成功) 或 `false` (键不存在)

### 工作流示例

#### 会话管理工作流

```
1. 用户登录
   → SET工具: key="session:{{sessionId}}", value="{{userData}}", ttl=1800

2. 验证会话
   → GET工具: key="session:{{sessionId}}"
   → 判断: exists == true → 会话有效

3. 用户登出
   → DELETE工具: key="session:{{sessionId}}"
```

#### 缓存优先查询

```
1. 尝试从缓存获取
   → GET工具: key="product:{{productId}}"

2. 判断缓存是否存在
   → 如果 exists == true: 直接使用缓存数据
   → 如果 exists == false: 查询数据库

3. 查询数据库后更新缓存
   → SET工具: key="product:{{productId}}", value="{{dbData}}", ttl=600
```

---

## 总结

本文档完整描述了 Redis 缓存工具集的开发:

1. **工具集架构**: 父级配置 + 3个子工具,共享连接配置
2. **配置规范**: inputs/outputs 使用纯字符串,不使用 i18n 对象
3. **代码复用**: 共享 client.ts 提供统一的连接和错误处理
4. **简洁设计**: 每个工具单一职责,接口清晰
5. **类型安全**: Zod 验证 + TypeScript 类型推导

通过这种设计,用户只需配置一次 Redis 连接串,即可使用所有缓存操作工具。
