# 企微获取 Corp Access Token 系统工具

## 概述

此工具用于获取企业微信的 Corp Access Token，是企业微信 API 调用的基础认证凭证。

## 设计目标

1. 提供简单易用的企业微信授权 Token 获取接口
2. 使用 FastGPT 反向调用框架实现跨线程通信
3. 支持在 FastGPT 工作流中作为系统工具使用
4. 类型安全、错误处理完善

## 架构设计

### 调用流程

```
FastGPT Workflow
      ↓
Worker Thread (Tool)
      ↓
invoke('wecom.getAuthToken', { corpId })
      ↓
Main Thread (lib/worker/index.ts)
      ↓
lib/invoke/wecom/getAuthToken.ts
      ↓
FastGPT API: /api/support/wecom/getAuthToken
      ↓
返回: { access_token, expires_in }
```

### 技术栈

- **运行时**: Worker Thread (Bun/Node.js v22)
- **类型验证**: Zod
- **通信机制**: FastGPT Invoke Framework
- **API**: FastGPT Internal API

## 核心实现

### 1. 工具实现 (`src/index.ts`)

```typescript
import { invoke } from '@/invoke';
import type { GetAuthTokenResult } from '@/invoke/wecom/getAuthToken';

export async function tool({ corpId }: { corpId: string }) {
  const result = await invoke<GetAuthTokenResult>('wecom.getAuthToken', {
    corpId
  });
  
  return {
    access_token: result.access_token,
    expires_in: result.expires_in
  };
}
```

**关键点**:
- 使用 `invoke` 函数调用 FastGPT API
- 类型安全：使用 `GetAuthTokenResult` 泛型
- 错误自动抛出到外层处理

### 2. 反向调用实现 (`lib/invoke/wecom/getAuthToken.ts`)

```typescript
async function getAuthToken(
  params: { corpId: string },
  systemVar: SystemVarType
): Promise<{ access_token: string; expires_in: number }> {
  // 参数验证
  const validated = GetAuthTokenParamsSchema.parse(params);
  
  // 调用 FastGPT API
  const url = new URL('/api/support/wecom/getAuthToken', FastGPTBaseURL);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authtoken: process.env.AUTH_TOKEN || ''
    },
    body: JSON.stringify({ corpId: validated.corpId })
  });
  
  // 返回结果
  return await response.json();
}

// 注册到 invoke 框架
registerInvokeHandler('wecom.getAuthToken', getAuthToken);
```

**关键点**:
- 使用 Zod 进行参数验证
- 调用 FastGPT 内部 API
- 自动注入 systemVar（虽然此方法不需要）
- 通过 `registerInvokeHandler` 注册

### 3. 工具配置 (`config.ts`)

定义工具的元数据：
- 工具名称（中英文）
- 描述信息
- 输入输出参数定义
- 版本信息

## 数据流

### 输入

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| corpId | string | 是 | 企业微信企业 ID |

### 输出

| 字段 | 类型 | 说明 |
|------|------|------|
| access_token | string | 企业访问令牌 |
| expires_in | number | 过期时间（秒） |

### FastGPT API 规范

**Endpoint**: `POST /api/support/wecom/getAuthToken`

**Request**:
```json
{
  "corpId": "ww1234567890abcdef"
}
```

**Response**:
```json
{
  "access_token": "abc123xyz456token",
  "expires_in": 7200
}
```

## 错误处理

### 参数验证错误
```typescript
// corpId 为空
throw new ZodError("corpId is required")
```

### API 调用错误
```typescript
// HTTP 错误
throw new Error("Failed to get auth token: 401 Unauthorized")

// 响应格式错误
throw new Error("Invalid response: missing access_token")
```

### 超时错误
```typescript
// 120 秒超时
throw new Error("Invoke wecom.getAuthToken timeout after 120 seconds")
```

## 使用场景

### 场景 1: 工作流中获取授权

1. 用户配置企业微信 corpId
2. 工作流执行时调用此工具
3. 获取 access_token
4. 将 token 传递给后续节点调用企业微信 API

### 场景 2: 定时刷新 Token

1. 通过定时触发器定期执行
2. 获取新的 access_token
3. 存储到变量或数据库
4. 其他节点使用最新的 token

## 性能考虑

- **缓存**: 建议在应用层缓存 token，避免频繁请求
- **过期时间**: 通常为 7200 秒，建议提前 5 分钟刷新
- **超时**: 120 秒超时保护，避免长时间阻塞
- **并发**: 支持多个工作流同时调用

## 安全注意事项

1. **Token 保护**: access_token 应妥善保管，避免泄露
2. **环境隔离**: 使用 AUTH_TOKEN 验证内部 API 调用
3. **参数验证**: 使用 Zod 严格验证输入
4. **错误信息**: 避免在错误消息中暴露敏感信息

## 测试策略

### 单元测试
- 参数验证测试
- 成功场景测试
- 错误场景测试

### 集成测试
- 完整的工作流调用测试
- 超时机制测试
- 并发调用测试

### 测试用例示例

```typescript
describe('wecomCorpId tool', () => {
  it('should get access token with valid corpId', async () => {
    const result = await tool({ corpId: 'valid_corp_id' });
    expect(result.access_token).toBeDefined();
    expect(result.expires_in).toBeGreaterThan(0);
  });

  it('should throw error with invalid corpId', async () => {
    await expect(tool({ corpId: '' })).rejects.toThrow();
  });
});
```

## 依赖关系

```
wecomCorpId (此工具)
    ↓
lib/invoke (反向调用框架)
    ↓
lib/worker (Worker 线程管理)
    ↓
FastGPT API (后端 API)
```

## 版本计划

### v0.1.0 (当前)
- ✅ 基础功能：获取 Corp Access Token
- ✅ 参数验证
- ✅ 错误处理
- ✅ 类型定义

### v0.2.0 (规划)
- Token 缓存机制
- 自动刷新功能
- 更详细的错误信息

### v1.0.0 (规划)
- 完整的企业微信 API 支持
- 多企业管理
- 性能优化

## 相关文档

- [FastGPT Invoke Framework](../../../../../lib/invoke/README.md)
- [企业微信 API 文档](https://developer.work.weixin.qq.com/document/)
- [工具开发指南](../../../../../.claude/CLAUDE.md)
