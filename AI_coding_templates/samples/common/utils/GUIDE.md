# FastGPT 插件开发工具函数库使用指南

## 概述

本工具函数库为 FastGPT 插件开发提供了一套完整的通用工具，包括数据验证、清洗、格式化、转换、异步控制、缓存管理等功能。所有工具都经过充分测试，遵循最佳实践，可以显著提高开发效率。

## 快速开始

### 安装依赖

```bash
npm install zod
npm install -D vitest @types/node
```

### 基础使用

```typescript
import {
  InputValidator,
  DataCleaner,
  TextFormatter,
  AsyncUtils,
  MemoryCache,
  generateUUID,
  isEmpty
} from './common/utils';

// 数据验证
InputValidator.validateEmail('user@example.com');

// 数据清洗
const cleanText = DataCleaner.normalizeWhitespace('  hello   world  ');

// 格式化
const formattedSize = TextFormatter.formatFileSize(1024 * 1024);

// 异步控制
await AsyncUtils.delay(1000);

// 缓存
const cache = new MemoryCache<string>(100, 60000);
cache.set('key', 'value');
```

## 核心功能模块

### 1. 数据验证 (InputValidator)

提供全面的数据验证功能，支持字符串、数字、邮箱、URL、JSON 等格式验证。

**主要特性：**
- 字符串长度验证
- 数值范围验证
- 邮箱格式验证
- URL 格式验证
- JSON 格式验证
- 文件扩展名验证
- 中文字符检测
- 中文手机号验证
- 身份证号验证

**使用场景：**
- 用户输入验证
- API 参数校验
- 配置文件验证
- 数据导入验证

### 2. 数据清洗 (DataCleaner)

提供强大的数据清洗和标准化功能，确保数据质量。

**主要特性：**
- HTML 标签清理
- 空白字符标准化
- 特殊字符移除
- 换行符标准化
- 空值移除
- 深度对象清理
- CSV/JSON 数据清理
- 联系方式清理

**使用场景：**
- 用户输入清理
- 数据导入预处理
- 文本内容清理
- 数据库存储前处理

### 3. 文本格式化 (TextFormatter)

提供丰富的文本和数据格式化功能，提升用户体验。

**主要特性：**
- 数字格式化（千分位分隔）
- 货币格式化
- 百分比格式化
- 日期时间格式化
- 文件大小格式化
- 持续时间格式化
- 文本截断
- 命名转换（驼峰、下划线、短横线）
- 相对时间显示

**使用场景：**
- 数据展示
- 报表生成
- 用户界面显示
- 日志格式化

### 4. 数据转换 (DataConverter)

提供多种数据格式转换功能，简化数据处理。

**主要特性：**
- CSV ↔ JSON 转换
- XML → JSON 转换
- 对象扁平化/反扁平化
- 数组 ↔ 对象转换
- 数组分组
- 数组去重
- 深度克隆
- 深度合并

**使用场景：**
- 数据导入导出
- API 数据转换
- 配置文件处理
- 数据结构转换

### 5. 异步控制 (AsyncUtils)

提供完整的异步操作控制工具，提高系统稳定性。

**主要特性：**
- 延迟执行
- 超时控制
- 重试机制（指数退避）
- 并发控制
- 批处理
- 任务队列
- 防抖/节流
- 可取消 Promise
- 信号量控制

**使用场景：**
- API 调用控制
- 批量数据处理
- 用户交互优化
- 系统性能优化

### 6. 缓存管理 (Cache)

提供高性能的内存缓存解决方案。

**主要特性：**
- TTL 支持
- LRU 淘汰策略
- 缓存统计
- 装饰器支持
- 多实例管理
- 自动清理

**使用场景：**
- API 响应缓存
- 计算结果缓存
- 配置信息缓存
- 临时数据存储

### 7. 通用辅助函数

提供常用的工具函数，简化日常开发。

**主要特性：**
- ID 生成（UUID、短ID）
- 空值检查
- 嵌套属性操作
- 数组操作（分块、打乱、取样）
- 数学计算
- 函数式编程工具
- 类型守卫

## 最佳实践

### 1. 错误处理

```typescript
try {
  InputValidator.validateEmail(email);
  // 处理有效邮箱
} catch (error) {
  console.error('邮箱验证失败:', error.message);
  // 处理验证错误
}
```

### 2. 性能优化

```typescript
// 使用缓存避免重复计算
const cache = new MemoryCache<string>(100, 300000); // 5分钟缓存

const expensiveOperation = memoize(async (input: string) => {
  // 耗时操作
  return await processData(input);
});
```

### 3. 并发控制

```typescript
// 控制并发数量，避免系统过载
const tasks = urls.map(url => () => fetchData(url));
const results = await AsyncUtils.concurrent(tasks, 5); // 最多5个并发
```

### 4. 数据验证链

```typescript
// 组合多个验证器
const validateUserInput = (data: any) => {
  InputValidator.validateStringLength(data.name, 1, 50, '姓名');
  InputValidator.validateEmail(data.email);
  InputValidator.validateChinesePhone(data.phone);
  
  return DataCleaner.deepClean(data);
};
```

### 5. 批量处理

```typescript
// 大量数据分批处理
const processLargeDataset = async (items: any[]) => {
  return AsyncUtils.batch(
    items,
    async (batch) => {
      // 处理每个批次
      return batch.map(item => processItem(item));
    },
    100 // 每批100项
  );
};
```

## 配置选项

### 全局配置

```typescript
import { initializeUtils } from './common/utils';

// 初始化工具配置
initializeUtils({
  cache: {
    defaultTTL: 300000, // 5分钟
    maxSize: 1000
  },
  async: {
    defaultTimeout: 30000, // 30秒
    defaultRetries: 3,
    defaultConcurrency: 10
  },
  validation: {
    throwOnError: true,
    customMessages: {
      'zh-CN': {
        required: '此字段为必填项',
        email: '请输入有效的邮箱地址'
      }
    }
  }
});
```

## 测试

### 运行测试

```bash
npm test
```

### 测试覆盖率

```bash
npm run test:coverage
```

### 自定义测试

```typescript
import { describe, it, expect } from 'vitest';
import { InputValidator } from './common/utils';

describe('自定义验证测试', () => {
  it('应该验证自定义格式', () => {
    expect(() => InputValidator.validateStringLength('test', 1, 10))
      .not.toThrow();
  });
});
```

## 扩展开发

### 添加新的验证器

```typescript
// 扩展 InputValidator
export class CustomValidator extends InputValidator {
  static validateCustomFormat(value: string): boolean {
    // 自定义验证逻辑
    return /^CUSTOM-\d{4}$/.test(value);
  }
}
```

### 添加新的格式化器

```typescript
// 扩展 TextFormatter
export class CustomFormatter extends TextFormatter {
  static formatCustomData(data: any): string {
    // 自定义格式化逻辑
    return `Custom: ${JSON.stringify(data)}`;
  }
}
```

### 添加新的缓存策略

```typescript
// 自定义缓存实现
export class CustomCache<T> extends MemoryCache<T> {
  constructor() {
    super(1000, 600000); // 1000项，10分钟TTL
  }
  
  // 自定义缓存逻辑
  customMethod() {
    // 实现自定义功能
  }
}
```

## 性能监控

### 缓存性能

```typescript
const cache = new MemoryCache<string>(100, 60000);

// 定期检查缓存性能
setInterval(() => {
  const stats = cache.getStats();
  console.log('缓存命中率:', stats.hitRate);
  console.log('缓存大小:', stats.size);
}, 60000);
```

### 异步操作监控

```typescript
// 监控异步操作性能
const monitoredFunction = async (data: any) => {
  const start = Date.now();
  try {
    const result = await AsyncUtils.timeout(
      processData(data),
      30000
    );
    console.log('操作耗时:', Date.now() - start, 'ms');
    return result;
  } catch (error) {
    console.error('操作失败:', error.message);
    throw error;
  }
};
```

## 常见问题

### Q: 如何处理大量数据的验证？

A: 使用批处理和并发控制：

```typescript
const validateLargeDataset = async (items: any[]) => {
  return AsyncUtils.batch(
    items,
    async (batch) => {
      const tasks = batch.map(item => () => validateItem(item));
      return AsyncUtils.concurrent(tasks, 5);
    },
    1000
  );
};
```

### Q: 如何优化缓存性能？

A: 合理设置缓存大小和TTL，定期清理过期项：

```typescript
const cache = new MemoryCache<string>(1000, 300000);

// 定期清理
setInterval(() => {
  const cleaned = cache.cleanup();
  console.log('清理了', cleaned, '个过期项');
}, 60000);
```

### Q: 如何处理异步操作的错误？

A: 使用重试机制和超时控制：

```typescript
const robustOperation = async (data: any) => {
  return AsyncUtils.retry(
    async () => {
      return AsyncUtils.timeout(
        processData(data),
        10000 // 10秒超时
      );
    },
    3, // 重试3次
    1000 // 1秒间隔
  );
};
```

## 总结

本工具函数库提供了 FastGPT 插件开发所需的核心工具，通过合理使用这些工具，可以：

1. **提高开发效率** - 减少重复代码编写
2. **保证代码质量** - 统一的验证和处理标准
3. **增强系统稳定性** - 完善的错误处理和异步控制
4. **优化性能** - 高效的缓存和批处理机制
5. **简化维护** - 模块化设计，易于扩展和维护

建议在项目开始时就引入这些工具，并根据具体需求进行配置和扩展。