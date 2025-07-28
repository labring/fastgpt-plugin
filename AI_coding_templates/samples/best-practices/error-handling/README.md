# FastGPT 插件错误处理最佳实践

本文档提供了 FastGPT 插件开发中错误处理的最佳实践和示例代码。

## 错误处理原则

### 1. 分层错误处理
- **输入验证层**：验证用户输入的有效性
- **业务逻辑层**：处理业务相关的错误
- **外部服务层**：处理API调用、网络等错误
- **系统层**：处理系统级别的错误

### 2. 错误分类
- **用户错误**：输入格式错误、参数缺失等
- **业务错误**：业务规则违反、权限不足等
- **系统错误**：网络超时、服务不可用等
- **未知错误**：预期外的异常情况

## 错误处理模式

### 1. 基础错误处理模式

```typescript
import { z } from 'zod';

export const InputType = z.object({
  input: z.string().min(1, '输入不能为空'),
  apiKey: z.string().min(1, 'API密钥不能为空')
});

export async function tool(props: z.infer<typeof InputType>): Promise<any> {
  try {
    // 1. 输入验证
    const validatedInput = InputType.parse(props);
    
    // 2. 业务逻辑处理
    const result = await processBusinessLogic(validatedInput);
    
    return {
      success: true,
      result
    };
    
  } catch (error) {
    // 3. 统一错误处理
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof z.ZodError) {
    // 输入验证错误
    throw new Error(`输入验证失败: ${error.errors[0].message}`);
  }
  
  if (error instanceof BusinessError) {
    // 业务逻辑错误
    throw new Error(`业务处理失败: ${error.message}`);
  }
  
  if (error instanceof NetworkError) {
    // 网络错误
    throw new Error(`网络请求失败: ${error.message}`);
  }
  
  // 未知错误
  console.error('未知错误:', error);
  throw new Error('处理过程中发生未知错误，请稍后重试');
}
```

### 2. 自定义错误类

```typescript
// 基础错误类
export abstract class BaseError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  constructor(message: string, public readonly details?: any) {
    super(message);
    this.name = this.constructor.name;
  }
}

// 业务错误
export class BusinessError extends BaseError {
  readonly code = 'BUSINESS_ERROR';
  readonly statusCode = 400;
}

// 网络错误
export class NetworkError extends BaseError {
  readonly code = 'NETWORK_ERROR';
  readonly statusCode = 502;
}

// API错误
export class ApiError extends BaseError {
  readonly code = 'API_ERROR';
  readonly statusCode = 503;
  
  constructor(message: string, public readonly apiCode?: string, details?: any) {
    super(message, details);
  }
}

// 权限错误
export class AuthenticationError extends BaseError {
  readonly code = 'AUTH_ERROR';
  readonly statusCode = 401;
}
```

### 3. 重试机制

```typescript
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
}

export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, backoffFactor, retryCondition } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // 检查是否应该重试
      if (attempt === maxRetries || (retryCondition && !retryCondition(lastError))) {
        break;
      }
      
      // 计算延迟时间
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );
      
      console.warn(`第 ${attempt + 1} 次重试失败，${delay}ms 后重试:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// 使用示例
export async function callExternalApi(url: string): Promise<any> {
  return retryWithExponentialBackoff(
    () => fetch(url).then(res => {
      if (!res.ok) throw new NetworkError(`HTTP ${res.status}: ${res.statusText}`);
      return res.json();
    }),
    {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      retryCondition: (error) => {
        // 只对网络错误和5xx错误重试
        return error instanceof NetworkError || 
               (error.message.includes('HTTP 5') || error.message.includes('timeout'));
      }
    }
  );
}
```

### 4. 超时处理

```typescript
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = '操作超时'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    })
  ]);
}

// 使用示例
export async function processWithTimeout(data: any): Promise<any> {
  try {
    return await withTimeout(
      processLongRunningTask(data),
      30000, // 30秒超时
      '数据处理超时，请检查输入数据大小'
    );
  } catch (error) {
    if (error.message.includes('超时')) {
      throw new Error('处理时间过长，建议减少数据量或分批处理');
    }
    throw error;
  }
}
```

### 5. 资源清理

```typescript
export async function processWithCleanup<T>(
  setup: () => Promise<any>,
  process: (resource: any) => Promise<T>,
  cleanup: (resource: any) => Promise<void>
): Promise<T> {
  let resource: any;
  
  try {
    resource = await setup();
    return await process(resource);
  } catch (error) {
    console.error('处理过程中发生错误:', error);
    throw error;
  } finally {
    if (resource) {
      try {
        await cleanup(resource);
      } catch (cleanupError) {
        console.error('资源清理失败:', cleanupError);
        // 不抛出清理错误，避免掩盖原始错误
      }
    }
  }
}

// 使用示例：数据库连接处理
export async function queryDatabase(sql: string): Promise<any> {
  return processWithCleanup(
    // 建立连接
    () => createDatabaseConnection(),
    // 执行查询
    (connection) => connection.query(sql),
    // 关闭连接
    (connection) => connection.close()
  );
}
```

## 错误日志记录

### 1. 结构化日志

```typescript
interface LogContext {
  requestId?: string;
  userId?: string;
  operation: string;
  timestamp: string;
  duration?: number;
}

export function logError(
  error: Error,
  context: LogContext,
  additionalData?: any
) {
  const logEntry = {
    level: 'error',
    message: error.message,
    error: {
      name: error.name,
      stack: error.stack,
      code: (error as any).code
    },
    context,
    additionalData,
    timestamp: new Date().toISOString()
  };
  
  console.error(JSON.stringify(logEntry, null, 2));
}

// 使用示例
export async function tool(props: any): Promise<any> {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    const result = await processRequest(props);
    
    // 记录成功日志
    console.log('请求处理成功', {
      requestId,
      duration: Date.now() - startTime,
      operation: 'tool_execution'
    });
    
    return result;
    
  } catch (error) {
    // 记录错误日志
    logError(error as Error, {
      requestId,
      operation: 'tool_execution',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    }, { input: sanitizeInput(props) });
    
    throw error;
  }
}
```

### 2. 敏感信息过滤

```typescript
export function sanitizeInput(input: any): any {
  if (typeof input !== 'object' || input === null) {
    return input;
  }
  
  const sensitiveKeys = [
    'password', 'apiKey', 'token', 'secret', 'authorization',
    'privateKey', 'accessToken', 'refreshToken'
  ];
  
  const sanitized = { ...input };
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive.toLowerCase())
    )) {
      sanitized[key] = '***';
    }
  });
  
  return sanitized;
}
```

## 用户友好的错误消息

### 1. 错误消息映射

```typescript
const ERROR_MESSAGES = {
  'INVALID_API_KEY': '请检查API密钥是否正确配置',
  'RATE_LIMIT_EXCEEDED': '请求频率过高，请稍后重试',
  'NETWORK_TIMEOUT': '网络连接超时，请检查网络状况',
  'INVALID_INPUT_FORMAT': '输入格式不正确，请参考示例格式',
  'SERVICE_UNAVAILABLE': '服务暂时不可用，请稍后重试'
};

export function getUserFriendlyMessage(error: Error): string {
  // 检查是否有预定义的用户友好消息
  const errorCode = (error as any).code;
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }
  
  // 根据错误类型返回通用消息
  if (error instanceof z.ZodError) {
    return `输入验证失败: ${error.errors[0].message}`;
  }
  
  if (error.message.includes('timeout')) {
    return '操作超时，请稍后重试';
  }
  
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return '网络连接失败，请检查网络状况';
  }
  
  // 默认消息
  return '处理过程中发生错误，请稍后重试';
}
```

## 测试错误处理

### 1. 错误场景测试

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('错误处理测试', () => {
  it('应该正确处理输入验证错误', async () => {
    const invalidInput = { input: '' }; // 空输入
    
    await expect(tool(invalidInput)).rejects.toThrow('输入不能为空');
  });
  
  it('应该正确处理网络错误', async () => {
    // Mock网络错误
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
    
    await expect(tool({ input: 'test', apiKey: 'valid' }))
      .rejects.toThrow('网络请求失败');
  });
  
  it('应该正确处理API错误', async () => {
    // Mock API错误响应
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    } as Response);
    
    await expect(tool({ input: 'test', apiKey: 'invalid' }))
      .rejects.toThrow('API密钥无效');
  });
  
  it('应该实现重试机制', async () => {
    let callCount = 0;
    vi.spyOn(global, 'fetch').mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.reject(new Error('Temporary error'));
      }
      return Promise.resolve({ ok: true, json: () => ({}) } as Response);
    });
    
    const result = await tool({ input: 'test', apiKey: 'valid' });
    expect(callCount).toBe(3); // 验证重试了3次
    expect(result).toBeDefined();
  });
});
```

## 总结

良好的错误处理是插件稳定性和用户体验的关键。遵循以上最佳实践可以：

1. **提高稳定性**：优雅处理各种异常情况
2. **改善用户体验**：提供清晰的错误信息
3. **便于调试**：详细的错误日志和上下文
4. **增强可维护性**：结构化的错误处理代码

记住：**预期错误，优雅处理，快速恢复**。