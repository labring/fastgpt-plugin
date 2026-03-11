# FastGPT 插件开发指南

## 快速开始

### 方式 1：使用 FastGPTPlugin 类（推荐）

最简单的方式，提供类型安全和自动错误处理：

```typescript
import { createPlugin } from '@fastgpt/plugin-pool';

// 创建并启动插件
createPlugin({ name: 'my-plugin' })
  .register('add', async ({ a, b }: { a: number; b: number }) => {
    return { result: a + b };
  })
  .register('greet', async ({ name }: { name: string }) => {
    return { message: `Hello, ${name}!` };
  })
  .start();
```

### 方式 2：批量注册方法

适合有多个相关方法的插件：

```typescript
import { createPlugin, defineMethod } from '@fastgpt/plugin-pool';

const mathMethods = {
  add: defineMethod(async ({ a, b }: { a: number; b: number }) => {
    return { result: a + b };
  }),

  multiply: defineMethod(async ({ a, b }: { a: number; b: number }) => {
    return { result: a * b };
  }),
};

createPlugin({ name: 'math-plugin' })
  .registerAll(mathMethods)
  .start();
```

### 方式 3：完整类型定义

适合大型插件，提供完整的类型安全：

```typescript
import { createPlugin, defineMethod } from '@fastgpt/plugin-pool';

// 定义类型
interface AddParams {
  a: number;
  b: number;
}

interface AddResult {
  result: number;
  operation: string;
}

// 创建插件
const plugin = createPlugin({ name: 'calculator' });

// 注册方法（完整类型）
plugin.register<AddParams, AddResult>('add', defineMethod(async (params) => {
  return {
    result: params.a + params.b,
    operation: 'add',
  };
}));

plugin.start();
```

## API 参考

### createPlugin(options?)

创建插件实例。

**参数：**
```typescript
interface PluginOptions {
  name?: string;           // 插件名称（用于日志）
  enableLog?: boolean;     // 是否启用日志（默认 true）
  logger?: {               // 自定义日志函数
    info: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
  };
}
```

**返回：** `FastGPTPlugin` 实例

**示例：**
```typescript
const plugin = createPlugin({
  name: 'my-plugin',
  enableLog: true,
  logger: {
    info: (msg, ...args) => console.log(`[INFO]`, msg, ...args),
    error: (msg, ...args) => console.error(`[ERROR]`, msg, ...args),
    warn: (msg, ...args) => console.warn(`[WARN]`, msg, ...args),
  },
});
```

### plugin.register(method, handler)

注册单个方法。

**参数：**
- `method: string` - 方法名
- `handler: (params: TParams) => Promise<TResult> | TResult` - 处理函数

**返回：** `this` (支持链式调用)

**示例：**
```typescript
plugin.register('add', async ({ a, b }) => {
  return { result: a + b };
});
```

### plugin.registerAll(methods)

批量注册方法。

**参数：**
```typescript
interface PluginMethodMap {
  [method: string]: PluginHandler;
}
```

**返回：** `this` (支持链式调用)

**示例：**
```typescript
plugin.registerAll({
  add: async ({ a, b }) => ({ result: a + b }),
  multiply: async ({ a, b }) => ({ result: a * b }),
});
```

### plugin.start()

启动插件，开始监听请求。

**示例：**
```typescript
plugin.start();
```

### defineMethod(handler)

定义类型安全的方法处理器。

**参数：**
- `handler: PluginHandler<TParams, TResult>` - 处理函数

**返回：** 类型化的处理函数

**示例：**
```typescript
const addMethod = defineMethod<AddParams, AddResult>(async (params) => {
  return { result: params.a + params.b };
});
```

## 完整示例

### 示例 1：简单计算器

```typescript
import { createPlugin } from '@fastgpt/plugin-pool';

createPlugin({ name: 'calculator' })
  .register('add', async ({ a, b }: { a: number; b: number }) => {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('参数必须是数字');
    }
    return { result: a + b };
  })
  .register('subtract', async ({ a, b }: { a: number; b: number }) => {
    return { result: a - b };
  })
  .register('multiply', async ({ a, b }: { a: number; b: number }) => {
    return { result: a * b };
  })
  .register('divide', async ({ a, b }: { a: number; b: number }) => {
    if (b === 0) throw new Error('除数不能为 0');
    return { result: a / b };
  })
  .start();
```

### 示例 2：文本处理器

```typescript
import { createPlugin, defineMethod } from '@fastgpt/plugin-pool';

interface TextParams {
  text: string;
  operation: 'uppercase' | 'lowercase' | 'reverse';
}

const plugin = createPlugin({ name: 'text-processor' });

plugin.register<TextParams>('processText', defineMethod(async (params) => {
  const { text, operation } = params;

  switch (operation) {
    case 'uppercase':
      return { result: text.toUpperCase() };
    case 'lowercase':
      return { result: text.toLowerCase() };
    case 'reverse':
      return { result: text.split('').reverse().join('') };
    default:
      throw new Error(`未知操作: ${operation}`);
  }
}));

plugin.start();
```

### 示例 3：异步操作

```typescript
import { createPlugin } from '@fastgpt/plugin-pool';

createPlugin({ name: 'async-plugin' })
  .register('fetchData', async ({ url }: { url: string }) => {
    // 模拟网络请求
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      url,
      data: { id: 1, content: 'data' },
      fetchedAt: new Date().toISOString(),
    };
  })
  .register('sleep', async ({ duration = 1000 }: { duration?: number }) => {
    await new Promise(resolve => setTimeout(resolve, duration));
    return { slept: duration };
  })
  .start();
```

### 示例 4：错误处理

```typescript
import { createPlugin } from '@fastgpt/plugin-pool';

createPlugin({ name: 'error-demo' })
  .register('validateAge', async ({ age }: { age: number }) => {
    if (age < 0) {
      throw new Error('年龄不能为负数');
    }
    if (age > 150) {
      throw new Error('年龄不合理');
    }
    return { valid: true, age };
  })
  .register('divideNumbers', async ({ a, b }: { a: number; b: number }) => {
    if (b === 0) {
      const error: any = new Error('除数不能为 0');
      error.code = 'DIVISION_BY_ZERO';
      throw error;
    }
    return { result: a / b };
  })
  .start();
```

## 对比：原始方式 vs 封装方式

### 原始方式（不推荐）

```typescript
// 需要手动处理所有细节
process.send?.({ version: '1.0', id: 'ready', type: 'ready', timestamp: Date.now() });

process.on('message', async (message) => {
  if (message.type !== 'request') return;

  try {
    let result;
    if (message.method === 'add') {
      result = message.params.a + message.params.b;
    }

    process.send?.({
      version: '1.0',
      id: message.id,
      type: 'response',
      result,
      timestamp: Date.now(),
      traceId: message.traceId,
    });
  } catch (error) {
    process.send?.({
      version: '1.0',
      id: message.id,
      type: 'response',
      error: { code: 'ERROR', message: error.message },
      timestamp: Date.now(),
    });
  }
});
```

### 封装方式（推荐）

```typescript
// 简洁、类型安全、自动错误处理
createPlugin({ name: 'my-plugin' })
  .register('add', async ({ a, b }) => ({ result: a + b }))
  .start();
```

## 优势

### 1. 类型安全
```typescript
// 完整的 TypeScript 类型支持
plugin.register<{ a: number }, { result: number }>('add', async (params) => {
  // params 自动推断为 { a: number }
  return { result: params.a * 2 };
});
```

### 2. 自动错误处理
```typescript
// 错误会自动捕获并发送给主进程
plugin.register('divide', async ({ a, b }) => {
  if (b === 0) throw new Error('除数不能为 0'); // 自动处理
  return { result: a / b };
});
```

### 3. 链式调用
```typescript
createPlugin()
  .register('method1', handler1)
  .register('method2', handler2)
  .register('method3', handler3)
  .start();
```

### 4. 批量注册
```typescript
const methods = {
  add: async ({ a, b }) => ({ result: a + b }),
  multiply: async ({ a, b }) => ({ result: a * b }),
};

plugin.registerAll(methods);
```

### 5. 自定义日志
```typescript
createPlugin({
  logger: {
    info: (msg) => myLogger.info(msg),
    error: (msg) => myLogger.error(msg),
    warn: (msg) => myLogger.warn(msg),
  },
});
```

## 最佳实践

### 1. 使用 TypeScript
```typescript
// ✅ 推荐：定义清晰的类型
interface UserParams {
  name: string;
  age: number;
}

interface UserResult {
  id: string;
  name: string;
  age: number;
  createdAt: string;
}

plugin.register<UserParams, UserResult>('createUser', async (params) => {
  // 类型安全
  return {
    id: generateId(),
    name: params.name,
    age: params.age,
    createdAt: new Date().toISOString(),
  };
});
```

### 2. 参数验证
```typescript
// ✅ 推荐：在方法开始时验证参数
plugin.register('processData', async (params) => {
  if (!params.data) {
    throw new Error('缺少 data 参数');
  }
  if (typeof params.data !== 'object') {
    throw new Error('data 必须是对象');
  }

  // 处理逻辑
  return { processed: true };
});
```

### 3. 错误信息清晰
```typescript
// ✅ 推荐：提供清晰的错误信息
plugin.register('validateEmail', async ({ email }) => {
  if (!email.includes('@')) {
    throw new Error('邮箱格式错误：缺少 @ 符号');
  }
  return { valid: true };
});
```

### 4. 使用 defineMethod
```typescript
// ✅ 推荐：使用 defineMethod 提高可读性
const addMethod = defineMethod<AddParams, AddResult>(async (params) => {
  return { result: params.a + params.b };
});

plugin.register('add', addMethod);
```

### 5. 组织代码
```typescript
// ✅ 推荐：按功能组织方法
const userMethods = {
  createUser: defineMethod(async (params) => { /* ... */ }),
  updateUser: defineMethod(async (params) => { /* ... */ }),
  deleteUser: defineMethod(async (params) => { /* ... */ }),
};

const postMethods = {
  createPost: defineMethod(async (params) => { /* ... */ }),
  updatePost: defineMethod(async (params) => { /* ... */ }),
};

plugin
  .registerAll(userMethods)
  .registerAll(postMethods)
  .start();
```

## 调试

### 启用日志
```typescript
createPlugin({
  name: 'my-plugin',
  enableLog: true, // 启用日志
});
```

### 自定义日志格式
```typescript
createPlugin({
  logger: {
    info: (msg, ...args) => {
      console.log(`[${new Date().toISOString()}] [INFO]`, msg, ...args);
    },
    error: (msg, ...args) => {
      console.error(`[${new Date().toISOString()}] [ERROR]`, msg, ...args);
    },
    warn: (msg, ...args) => {
      console.warn(`[${new Date().toISOString()}] [WARN]`, msg, ...args);
    },
  },
});
```

## 常见问题

### Q: 如何处理异步操作？
A: 直接使用 async/await，封装会自动处理：
```typescript
plugin.register('fetchData', async ({ url }) => {
  const response = await fetch(url);
  const data = await response.json();
  return { data };
});
```

### Q: 如何抛出自定义错误码？
A: 在 Error 对象上添加 code 属性：
```typescript
plugin.register('validate', async (params) => {
  const error: any = new Error('验证失败');
  error.code = 'VALIDATION_ERROR';
  throw error;
});
```

### Q: 如何禁用日志？
A: 设置 `enableLog: false`：
```typescript
createPlugin({ enableLog: false });
```

### Q: 可以在一个插件中注册多少个方法？
A: 没有限制，但建议按功能拆分成多个插件。

## 参考

- [完整示例](./example_plugin_v2.ts)
- [简单示例](./simple_plugin.ts)
- [高级示例](./advanced_plugin.ts)
