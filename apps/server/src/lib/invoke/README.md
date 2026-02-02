# FastGPT Reverse Invocation Framework

## 概述

这是一个通用的反向调用框架，允许运行在 Worker 线程中的工具通过消息传递机制调用 FastGPT 的 API 方法。

## 架构

```
Worker Thread                    Main Thread
     |                                |
     | invoke('method', params)       |
     |------------------------------->|
     |                                |
     |                          路由到处理器
     |                          自动注入 systemVar
     |                          执行 API 调用
     |                                |
     |<-------------------------------|
     |      返回结果或错误              |
```

## 快速开始

### 在工具中使用

```typescript
import { invoke } from '@/invoke';

export async function myTool(input: ToolInput): Promise<ToolOutput> {
  // 调用 getAccessToken（systemVar 自动注入）
  const accessToken = await invoke<string>('getAccessToken', {});
  
  // 使用 token 调用外部 API
  const response = await fetch('https://api.example.com/data', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  
  return {
    data: await response.json()
  };
}
```

## 添加新方法

### 步骤 1: 创建方法实现

创建 `lib/invoke/yourMethod.ts`：

```typescript
import { registerInvokeHandler } from './registry';
import type { SystemVarType } from '@tool/type/req';

// 定义参数类型
type YourMethodParams = {
  param1: string;
  param2?: number;
};

// 定义返回类型
type YourMethodResult = {
  success: boolean;
  data: any;
};

// 实现方法
async function yourMethod(
  params: YourMethodParams,
  systemVar: SystemVarType
): Promise<YourMethodResult> {
  // 可以使用 systemVar 中的信息
  const userId = systemVar.user.id;
  const teamId = systemVar.user.teamId;
  
  // 实现你的逻辑
  const result = await doSomething(params, userId, teamId);
  
  return {
    success: true,
    data: result
  };
}

// 注册方法
registerInvokeHandler('yourMethod', yourMethod);

export { yourMethod };
```

### 步骤 2: 在入口文件中导入

编辑 `lib/invoke/index.ts`，添加导入：

```typescript
import './yourMethod';
```

### 步骤 3: 在工具中使用

```typescript
import { invoke } from '@/invoke';

const result = await invoke<YourMethodResult>('yourMethod', {
  param1: 'value',
  param2: 123
});
```

## 可用方法

### getAccessToken

获取 FastGPT 访问令牌。

```typescript
const token = await invoke<string>('getAccessToken', {});
```

**参数**: 无（systemVar 自动注入）

**返回**: `string` - Access token

## SystemVar 结构

SystemVar 会自动注入到每个方法中，包含以下信息：

```typescript
{
  user: {
    id: string;           // 用户 ID
    username: string;     // 用户名
    teamId: string;       // 团队 ID
    teamName: string;     // 团队名称
    membername: string;   // 成员名称（tmbId）
    contact: string;      // 联系方式
    name: string;         // 显示名称
  },
  app: {
    id: string;           // 应用 ID
    name: string;         // 应用名称
  },
  tool: {
    id: string;           // 工具 ID
    version: string;      // 工具版本
  },
  time: string;           // 时间戳
}
```

## 技术细节

### 超时机制

所有 invoke 调用默认 120 秒超时。超时后会自动拒绝 Promise。

### 错误处理

遵循项目规范，直接抛出错误：

```typescript
try {
  const result = await invoke('someMethod', params);
} catch (error) {
  console.error('Invoke failed:', error.message);
}
```

### 类型安全

使用 TypeScript 泛型指定返回类型：

```typescript
const token = await invoke<string>('getAccessToken', {});
const data = await invoke<MyDataType>('getData', { id: '123' });
```

## 文件结构

```
lib/invoke/
├── index.ts           # 统一导出入口
├── registry.ts        # 方法注册表
├── const.ts           # 常量配置
├── accessToken.ts     # getAccessToken 方法实现
└── README.md          # 本文档

lib/worker/
├── invoke.ts          # invoke 函数实现
├── worker.ts          # Worker 端消息处理
├── index.ts           # Main Thread 消息处理
└── type.ts            # 类型定义
```

## 兼容性

- ✅ Bun 运行时
- ✅ Node.js v22+
- ✅ 使用标准 Node.js API
- ✅ 完整的 TypeScript 支持

## 安全注意事项

1. **方法白名单**: 只有注册的方法可以被调用
2. **参数验证**: 建议使用 Zod 验证输入参数
3. **权限检查**: 通过 systemVar 验证用户权限
4. **超时保护**: 自动 120 秒超时防止资源占用

## 示例：完整的方法实现

```typescript
// lib/invoke/sendNotification.ts
import { z } from 'zod';
import { registerInvokeHandler } from './registry';
import type { SystemVarType } from '@tool/type/req';
import { FastGPTBaseURL } from './const';

// 使用 Zod 验证参数
const SendNotificationParamsSchema = z.object({
  message: z.string().min(1),
  type: z.enum(['info', 'warning', 'error']).default('info')
});

type SendNotificationParams = z.infer<typeof SendNotificationParamsSchema>;

async function sendNotification(
  params: SendNotificationParams,
  systemVar: SystemVarType
): Promise<{ success: boolean; messageId: string }> {
  // 验证参数
  const validated = SendNotificationParamsSchema.parse(params);
  
  // 调用 FastGPT API
  const url = new URL('/api/notification/send', FastGPTBaseURL);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authtoken': process.env.AUTH_TOKEN || ''
    },
    body: JSON.stringify({
      userId: systemVar.user.id,
      teamId: systemVar.user.teamId,
      message: validated.message,
      type: validated.type
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to send notification: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result;
}

registerInvokeHandler('sendNotification', sendNotification);

export { sendNotification };
```

使用：

```typescript
await invoke('sendNotification', {
  message: 'Processing complete',
  type: 'info'
});
```
