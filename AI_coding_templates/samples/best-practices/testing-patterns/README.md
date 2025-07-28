# FastGPT 插件测试模式最佳实践

本文档提供了 FastGPT 插件开发中测试相关的最佳实践和示例代码。

## 测试策略

### 1. 测试金字塔
- **单元测试（70%）**：测试单个函数和组件
- **集成测试（20%）**：测试模块间交互
- **端到端测试（10%）**：测试完整用户场景

### 2. 测试类型
- **功能测试**：验证功能正确性
- **性能测试**：验证响应时间和吞吐量
- **安全测试**：验证安全防护措施
- **兼容性测试**：验证不同环境下的兼容性

## 单元测试

### 1. 基础测试结构

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tool, validateTool } from '../src/index';

describe('插件核心功能测试', () => {
  beforeEach(() => {
    // 测试前的准备工作
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // 测试后的清理工作
    vi.restoreAllMocks();
  });
  
  describe('基础功能', () => {
    it('应该正确处理有效输入', async () => {
      const input = {
        text: '测试文本',
        options: { format: 'json' }
      };
      
      const result = await tool(input);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.metadata).toBeDefined();
    });
    
    it('应该拒绝无效输入', async () => {
      const invalidInput = {
        text: '', // 空文本
        options: {}
      };
      
      await expect(tool(invalidInput)).rejects.toThrow('输入文本不能为空');
    });
    
    it('应该处理边界情况', async () => {
      const edgeCases = [
        { text: 'a', options: {} }, // 最小输入
        { text: 'a'.repeat(10000), options: {} }, // 大输入
        { text: '🚀🌟💫', options: {} }, // Unicode字符
        { text: '   \n\t   ', options: {} } // 只有空白字符
      ];
      
      for (const testCase of edgeCases) {
        const result = await tool(testCase);
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      }
    });
  });
  
  describe('错误处理', () => {
    it('应该优雅地处理网络错误', async () => {
      // 模拟网络错误
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
      
      const input = { text: '测试', options: {} };
      const result = await tool(input);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('网络');
    });
    
    it('应该处理超时情况', async () => {
      // 模拟超时
      vi.spyOn(global, 'fetch').mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 60000))
      );
      
      const input = { text: '测试', options: { timeout: 1000 } };
      
      await expect(tool(input)).rejects.toThrow('超时');
    });
  });
});
```

### 2. 数据驱动测试

```typescript
describe('数据驱动测试', () => {
  const testCases = [
    {
      name: '中文文本处理',
      input: { text: '这是中文测试文本', options: {} },
      expected: { language: 'zh', wordCount: 7 }
    },
    {
      name: '英文文本处理',
      input: { text: 'This is English test text', options: {} },
      expected: { language: 'en', wordCount: 5 }
    },
    {
      name: '混合语言文本',
      input: { text: 'Hello 世界', options: {} },
      expected: { language: 'mixed', wordCount: 2 }
    }
  ];
  
  testCases.forEach(({ name, input, expected }) => {
    it(`应该正确处理：${name}`, async () => {
      const result = await tool(input);
      
      expect(result.success).toBe(true);
      expect(result.data.language).toBe(expected.language);
      expect(result.data.wordCount).toBe(expected.wordCount);
    });
  });
});
```

### 3. Mock 和 Stub

```typescript
import { vi } from 'vitest';

describe('外部依赖测试', () => {
  it('应该正确调用外部API', async () => {
    // Mock fetch
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ result: 'success' })
    };
    
    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValue(mockResponse as any);
    
    const input = { text: '测试', options: {} };
    await tool(input);
    
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
  });
  
  it('应该正确处理API响应', async () => {
    const mockApiResponse = {
      data: { processed: true },
      metadata: { timestamp: '2024-01-01' }
    };
    
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse)
    } as any);
    
    const result = await tool({ text: '测试', options: {} });
    
    expect(result.data.processed).toBe(true);
    expect(result.metadata.timestamp).toBe('2024-01-01');
  });
});
```

## 集成测试

### 1. 模块间交互测试

```typescript
describe('模块集成测试', () => {
  it('应该正确处理完整的数据流', async () => {
    // 测试从输入验证到输出格式化的完整流程
    const input = {
      text: '这是一个完整的集成测试示例',
      options: {
        analyze: true,
        format: 'detailed'
      }
    };
    
    const result = await tool(input);
    
    // 验证输入验证模块
    expect(result.metadata.inputValidation).toBe('passed');
    
    // 验证处理模块
    expect(result.data.analysis).toBeDefined();
    expect(result.data.analysis.wordCount).toBeGreaterThan(0);
    
    // 验证输出格式化模块
    expect(result.data.formatted).toBe(true);
    expect(result.metadata.processingTime).toBeGreaterThan(0);
  });
  
  it('应该正确处理错误传播', async () => {
    // 测试错误在模块间的正确传播
    const invalidInput = { text: null, options: {} };
    
    const result = await tool(invalidInput as any);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('输入验证失败');
    expect(result.metadata.errorModule).toBe('validation');
  });
});
```

### 2. 配置和环境测试

```typescript
describe('配置和环境测试', () => {
  it('应该在不同配置下正确工作', async () => {
    const configs = [
      { maxLength: 100, timeout: 5000 },
      { maxLength: 1000, timeout: 10000 },
      { maxLength: 10000, timeout: 30000 }
    ];
    
    for (const config of configs) {
      process.env.MAX_LENGTH = config.maxLength.toString();
      process.env.TIMEOUT = config.timeout.toString();
      
      const result = await tool({
        text: 'a'.repeat(config.maxLength - 1),
        options: {}
      });
      
      expect(result.success).toBe(true);
    }
  });
  
  it('应该正确处理环境变量缺失', async () => {
    delete process.env.API_KEY;
    
    const result = await tool({ text: '测试', options: {} });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('API密钥');
  });
});
```

## 性能测试

### 1. 响应时间测试

```typescript
describe('性能测试', () => {
  it('应该在合理时间内完成处理', async () => {
    const input = {
      text: 'a'.repeat(1000), // 1KB文本
      options: {}
    };
    
    const startTime = performance.now();
    const result = await tool(input);
    const endTime = performance.now();
    
    const processingTime = endTime - startTime;
    
    expect(result.success).toBe(true);
    expect(processingTime).toBeLessThan(1000); // 应该在1秒内完成
  });
  
  it('应该能处理大量数据', async () => {
    const largeText = 'a'.repeat(100000); // 100KB文本
    
    const result = await tool({
      text: largeText,
      options: {}
    });
    
    expect(result.success).toBe(true);
    expect(result.metadata.processingTime).toBeLessThan(5000); // 5秒内
  });
  
  it('内存使用应该保持稳定', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // 处理多个请求
    for (let i = 0; i < 100; i++) {
      await tool({
        text: `测试文本 ${i}`,
        options: {}
      });
    }
    
    // 强制垃圾回收
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = finalMemory - initialMemory;
    
    // 内存增长应该小于10MB
    expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
  });
});
```

### 2. 并发测试

```typescript
describe('并发测试', () => {
  it('应该正确处理并发请求', async () => {
    const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
      tool({
        text: `并发测试 ${i}`,
        options: {}
      })
    );
    
    const results = await Promise.all(concurrentRequests);
    
    // 所有请求都应该成功
    results.forEach((result, index) => {
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
  
  it('应该正确处理资源竞争', async () => {
    // 模拟资源竞争场景
    const sharedResource = { counter: 0 };
    
    const tasks = Array.from({ length: 50 }, () => 
      tool({
        text: '资源竞争测试',
        options: { sharedResource }
      })
    );
    
    await Promise.all(tasks);
    
    // 验证资源状态的一致性
    expect(sharedResource.counter).toBe(50);
  });
});
```

## 端到端测试

### 1. 用户场景测试

```typescript
describe('端到端测试', () => {
  it('应该支持完整的用户工作流', async () => {
    // 场景：用户上传文档，进行分析，获取结果
    
    // 步骤1：上传文档
    const document = '这是一个需要分析的文档内容...';
    
    // 步骤2：进行基础分析
    const basicAnalysis = await tool({
      text: document,
      options: { type: 'basic' }
    });
    
    expect(basicAnalysis.success).toBe(true);
    
    // 步骤3：进行深度分析
    const deepAnalysis = await tool({
      text: document,
      options: { 
        type: 'deep',
        previousResult: basicAnalysis.data
      }
    });
    
    expect(deepAnalysis.success).toBe(true);
    expect(deepAnalysis.data.insights).toBeDefined();
    
    // 步骤4：生成报告
    const report = await tool({
      text: document,
      options: {
        type: 'report',
        analysisData: deepAnalysis.data
      }
    });
    
    expect(report.success).toBe(true);
    expect(report.data.report).toBeDefined();
  });
});
```

## 测试工具和配置

### 1. Vitest 配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 测试环境
    environment: 'node',
    
    // 全局设置
    globals: true,
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // 超时设置
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // 并发设置
    threads: true,
    maxThreads: 4,
    
    // 重试设置
    retry: 2,
    
    // 测试文件模式
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache']
  }
});
```

### 2. 测试辅助工具

```typescript
// test/helpers.ts

// 测试数据生成器
export class TestDataGenerator {
  static generateText(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789 ';
    return Array.from({ length }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  }
  
  static generateChineseText(length: number): string {
    const chars = '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取据处队南给色光门即保治北造百规热领七海口东导器压志世金增争济阶油思术极交受联什认六共权收证改清己美再采转更单风切打白教速花带安场身车例真务具万每目至达走积示议声报斗完类八离华名确才科张信马节话米整空元况今集温传土许步群广石记需段研界拉林律叫且究观越织装影算低持音众书布复容儿须际商非验连断深难近矿千周委素技备半办青省列习响约支般史感劳便团往酸历市克何除消构府称太准精值号率族维划选标写存候毛亲快效斯院查江型眼王按格养易置派层片始却专状育厂京识适属圆包火住调满县局照参红细引听该铁价严';
    return Array.from({ length }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  }
  
  static generateMixedText(length: number): string {
    const english = this.generateText(Math.floor(length / 2));
    const chinese = this.generateChineseText(Math.floor(length / 2));
    return english + ' ' + chinese;
  }
}

// 性能测试辅助
export class PerformanceHelper {
  static async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
    const start = performance.now();
    const result = await fn();
    const time = performance.now() - start;
    return { result, time };
  }
  
  static async measureMemory<T>(fn: () => Promise<T>): Promise<{ result: T; memoryDelta: number }> {
    const initialMemory = process.memoryUsage().heapUsed;
    const result = await fn();
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryDelta = finalMemory - initialMemory;
    return { result, memoryDelta };
  }
}

// Mock 辅助
export class MockHelper {
  static createMockFetch(responses: Array<{ url: string; response: any }>) {
    return vi.fn().mockImplementation((url: string) => {
      const mockResponse = responses.find(r => url.includes(r.url));
      if (!mockResponse) {
        return Promise.reject(new Error(`No mock response for ${url}`));
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse.response),
        text: () => Promise.resolve(JSON.stringify(mockResponse.response))
      });
    });
  }
}
```

## 持续集成

### 1. GitHub Actions 配置

```yaml
# .github/workflows/test.yml
name: 测试

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: 使用 Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: 安装依赖
      run: npm ci
    
    - name: 运行 lint
      run: npm run lint
    
    - name: 运行类型检查
      run: npm run type-check
    
    - name: 运行测试
      run: npm run test:coverage
    
    - name: 上传覆盖率报告
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
```

## 总结

测试是确保插件质量的重要手段，需要：

1. **全面覆盖**：单元、集成、端到端测试
2. **自动化**：CI/CD 集成，自动运行测试
3. **性能监控**：响应时间和资源使用测试
4. **边界测试**：异常情况和边界条件
5. **持续改进**：根据测试结果优化代码

记住：**好的测试不仅能发现问题，还能指导设计**。