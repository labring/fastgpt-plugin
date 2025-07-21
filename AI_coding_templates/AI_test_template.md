# 🧪 FastGPT 插件测试指南

## 📋 测试策略概览

### 🎯 测试目标
- **功能正确性**: 确保插件按预期工作
- **类型安全**: 验证输入输出类型的正确性
- **错误处理**: 测试异常情况的处理
- **性能表现**: 验证在不同负载下的表现
- **集成兼容**: 确保与FastGPT系统的兼容性

### 🔧 测试框架
- **Vitest**: 主要测试框架，支持TypeScript和ES模块
- **Zod**: 用于运行时类型验证测试
- **Mock**: 模拟外部依赖和API调用

## 🏗️ 测试结构与分类

### 📁 测试文件结构
```
plugin-name/
└── test/
    ├── index.test.ts          # 主要功能测试
    ├── integration.test.ts    # 集成测试 (可选)
    ├── performance.test.ts    # 性能测试 (可选)
    └── mocks/
        ├── api-responses.ts   # API响应模拟数据
        └── test-data.ts       # 测试数据集
```

### 🧩 测试分类

#### 1. **单元测试** (必需)
- 测试核心函数逻辑
- 验证输入输出类型
- 边界条件测试

#### 2. **集成测试** (推荐)
- 测试与外部API的集成
- 验证数据流转换
- 端到端功能测试

#### 3. **性能测试** (可选)
- 响应时间测试
- 并发处理测试
- 内存使用测试

## 📝 测试模板

### 🎯 1. 简单工具类测试模板

```typescript
// test/index.test.ts - 简单工具类测试
import { expect, test, describe } from 'vitest';
import { tool, InputType, OutputType } from '../src';
import config from '../config';

describe('简单工具插件测试', () => {
  // 配置验证测试
  test('插件配置验证', () => {
    expect(config.name).toBeDefined();
    expect(config.description).toBeDefined();
    expect(config.versionList).toHaveLength(1);
    expect(config.versionList[0].inputs).toBeDefined();
    expect(config.versionList[0].outputs).toBeDefined();
  });

  // 基本功能测试
  test('基本功能测试', async () => {
    const input = { input_param: 1000 };
    const validatedInput = InputType.parse(input);
    
    const result = await tool(validatedInput);
    
    expect(result).toBeDefined();
    expect(OutputType.parse(result)).toBeDefined();
    expect(result.result).toContain('1000');
  });

  // 输入验证测试
  test('输入验证测试', () => {
    // 有效输入
    expect(() => InputType.parse({ input_param: 1000 })).not.toThrow();
    expect(() => InputType.parse({})).not.toThrow(); // 可选参数
    
    // 无效输入
    expect(() => InputType.parse({ input_param: 0 })).toThrow();
    expect(() => InputType.parse({ input_param: 300001 })).toThrow();
    expect(() => InputType.parse({ input_param: 'invalid' })).toThrow();
  });

  // 边界条件测试
  test('边界条件测试', async () => {
    // 最小值
    const minResult = await tool({ input_param: 1 });
    expect(minResult).toBeDefined();
    
    // 最大值
    const maxResult = await tool({ input_param: 300000 });
    expect(maxResult).toBeDefined();
    
    // 默认值
    const defaultResult = await tool({});
    expect(defaultResult).toBeDefined();
  });
});
```

### 🌐 2. API集成类测试模板

```typescript
// test/index.test.ts - API集成类测试
import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
import { tool, InputType, OutputType } from '../src';
import { mockApiResponses } from './mocks/api-responses';

// Mock全局fetch
global.fetch = vi.fn();

describe('API集成插件测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 成功场景测试
  test('API调用成功测试', async () => {
    // Mock成功响应
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponses.success
    });

    const input = { query: '测试查询', limit: 5 };
    const result = await tool(input);

    expect(result).toBeDefined();
    expect(result.totalCount).toBeGreaterThan(0);
    expect(result.result).toContain('测试');
    expect(result.summary).toContain('测试查询');
    
    // 验证API调用参数
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('q=测试查询'),
      expect.any(Object)
    );
  });

  // 错误处理测试
  test('API错误处理测试', async () => {
    // Mock API错误
    (fetch as any).mockRejectedValueOnce(new Error('网络错误'));

    const input = { query: '测试查询' };
    
    await expect(tool(input)).rejects.toThrow('查询失败');
  });

  // HTTP错误状态测试
  test('HTTP错误状态测试', async () => {
    // Mock HTTP错误响应
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    const input = { query: '测试查询' };
    
    await expect(tool(input)).rejects.toThrow('API调用失败: 404 Not Found');
  });

  // 空结果处理测试
  test('空结果处理测试', async () => {
    // Mock空结果响应
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponses.empty
    });

    const input = { query: '不存在的查询' };
    const result = await tool(input);

    expect(result.totalCount).toBe(0);
    expect(result.result).toBe('');
    expect(result.summary).toContain('0条结果');
  });

  // 大数据量测试
  test('大数据量处理测试', async () => {
    // Mock大数据响应
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponses.largeData
    });

    const input = { query: '热门查询', limit: 100 };
    const result = await tool(input);

    expect(result.totalCount).toBe(100);
    expect(result.result.length).toBeGreaterThan(1000); // 确保有足够的内容
  });

  // 输入验证测试
  test('输入验证测试', () => {
    // 有效输入
    expect(() => InputType.parse({ query: '有效查询' })).not.toThrow();
    expect(() => InputType.parse({ query: '查询', limit: 50 })).not.toThrow();
    
    // 无效输入
    expect(() => InputType.parse({ query: '' })).toThrow();
    expect(() => InputType.parse({ query: 'valid', limit: 0 })).toThrow();
    expect(() => InputType.parse({ query: 'valid', limit: 101 })).toThrow();
  });
});
```

### 🧪 3. Mock数据模板

```typescript
// test/mocks/api-responses.ts - API响应模拟数据
export const mockApiResponses = {
  // 成功响应
  success: {
    data: [
      {
        id: '1',
        title: '测试标题1',
        description: '这是一个测试描述',
        url: 'https://example.com/1',
        date: '2024-01-01'
      },
      {
        id: '2',
        title: '测试标题2',
        description: '这是另一个测试描述',
        url: 'https://example.com/2',
        date: '2024-01-02'
      }
    ],
    total: 2,
    page: 1,
    pageSize: 10
  },

  // 空结果响应
  empty: {
    data: [],
    total: 0,
    page: 1,
    pageSize: 10
  },

  // 大数据响应
  largeData: {
    data: Array.from({ length: 100 }, (_, i) => ({
      id: `${i + 1}`,
      title: `大数据测试标题${i + 1}`,
      description: `这是第${i + 1}个测试项目的详细描述，包含更多内容以测试数据处理能力`,
      url: `https://example.com/${i + 1}`,
      date: `2024-01-${String(i % 30 + 1).padStart(2, '0')}`
    })),
    total: 100,
    page: 1,
    pageSize: 100
  },

  // 错误响应
  error: {
    error: 'API_ERROR',
    message: '服务器内部错误',
    code: 500
  }
};

// test/mocks/test-data.ts - 测试数据集
export const testData = {
  // 有效输入数据
  validInputs: [
    { query: '癌症', limit: 10 },
    { query: 'cancer research', limit: 5 },
    { query: '心脏病', limit: 20 },
    { query: 'diabetes' } // 使用默认limit
  ],

  // 无效输入数据
  invalidInputs: [
    { query: '', limit: 10 }, // 空查询
    { query: 'valid', limit: 0 }, // 无效limit
    { query: 'valid', limit: 101 }, // 超出范围limit
    { query: 123, limit: 10 }, // 错误类型
    {} // 缺少必需字段
  ],

  // 边界条件数据
  boundaryInputs: [
    { query: 'a', limit: 1 }, // 最小值
    { query: 'a'.repeat(100), limit: 100 }, // 最大值
    { query: '中文查询测试', limit: 50 } // 中文输入
  ]
};
```

### 🚀 4. 性能测试模板

```typescript
// test/performance.test.ts - 性能测试
import { expect, test, describe, vi } from 'vitest';
import { tool } from '../src';

describe('性能测试', () => {
  // 响应时间测试
  test('响应时间测试', async () => {
    // Mock快速响应
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], total: 0 })
    });

    const startTime = Date.now();
    await tool({ query: '性能测试' });
    const endTime = Date.now();

    const responseTime = endTime - startTime;
    expect(responseTime).toBeLessThan(5000); // 5秒内响应
  });

  // 并发测试
  test('并发处理测试', async () => {
    // Mock响应
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], total: 0 })
    });

    const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
      tool({ query: `并发测试${i}` })
    );

    const startTime = Date.now();
    const results = await Promise.all(concurrentRequests);
    const endTime = Date.now();

    expect(results).toHaveLength(10);
    expect(endTime - startTime).toBeLessThan(10000); // 10秒内完成
  });

  // 内存使用测试
  test('内存使用测试', async () => {
    // Mock大数据响应
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      title: `大数据项目${i}`,
      description: 'x'.repeat(1000) // 1KB描述
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: largeData, total: 1000 })
    });

    const initialMemory = process.memoryUsage().heapUsed;
    await tool({ query: '大数据测试', limit: 100 });
    const finalMemory = process.memoryUsage().heapUsed;

    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB内存增长限制
  });
});
```

## 🔧 测试配置与运行

### 📋 package.json 测试脚本
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "c8": "^8.0.0"
  }
}
```

### ⚙️ vitest.config.ts 配置
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts'
      ]
    },
    timeout: 30000, // 30秒超时
    testTimeout: 10000 // 单个测试10秒超时
  }
});
```

## 📊 测试覆盖率要求

### 🎯 覆盖率目标
- **语句覆盖率**: ≥ 80%
- **分支覆盖率**: ≥ 70%
- **函数覆盖率**: ≥ 90%
- **行覆盖率**: ≥ 80%

### 📈 关键测试点
1. **核心功能**: 100%覆盖
2. **错误处理**: 100%覆盖
3. **边界条件**: 100%覆盖
4. **输入验证**: 100%覆盖
5. **API集成**: ≥ 80%覆盖

## 🚨 常见测试陷阱

### ❌ 避免的错误
1. **不测试错误情况**: 必须测试异常和错误处理
2. **忽略边界条件**: 测试最小值、最大值、空值等
3. **Mock不充分**: 确保外部依赖都被正确Mock
4. **测试数据不真实**: 使用接近真实场景的测试数据
5. **异步测试错误**: 正确处理Promise和async/await

### ✅ 最佳实践
1. **测试先行**: 编写代码前先写测试
2. **独立测试**: 每个测试应该独立运行
3. **清晰命名**: 测试名称应该清楚描述测试内容
4. **适当分组**: 使用describe对相关测试进行分组
5. **定期重构**: 保持测试代码的清洁和可维护性

## 🔄 持续集成

### 🚀 CI/CD 集成
```yaml
# .github/workflows/test.yml
name: 测试
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

### 📋 测试检查清单
- [ ] 所有测试通过
- [ ] 覆盖率达标
- [ ] 无测试警告
- [ ] 性能测试通过
- [ ] 集成测试通过
- [ ] 文档更新完成

通过遵循这个测试指南，可以确保FastGPT插件的质量和可靠性，提高开发效率和用户体验。