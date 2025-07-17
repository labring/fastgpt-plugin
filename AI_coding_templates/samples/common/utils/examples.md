# 工具函数使用示例

本文档展示了如何使用 FastGPT 插件开发工具函数库中的各种工具。

## 快速开始

```typescript
import {
  InputValidator,
  DataCleaner,
  TextFormatter,
  DataConverter,
  AsyncUtils,
  MemoryCache,
  generateUUID,
  isEmpty,
  chunk
} from './utils';

// 基本使用示例
const cache = new MemoryCache<string>(100, 60000); // 100项，1分钟TTL
const uuid = generateUUID();
const isEmptyValue = isEmpty('');
```

## 数据验证示例

### 基础验证

```typescript
import { InputValidator, ValidationSchemaFactory } from './utils';

// 字符串长度验证
try {
  InputValidator.validateStringLength('hello', 1, 10, '用户名');
  console.log('验证通过');
} catch (error) {
  console.error('验证失败:', error.message);
}

// 邮箱验证
const isValidEmail = InputValidator.validateEmail('user@example.com');
console.log('邮箱有效:', isValidEmail);

// URL验证
const isValidUrl = InputValidator.validateUrl('https://example.com');
console.log('URL有效:', isValidUrl);
```

### Zod 模式验证

```typescript
import { z } from 'zod';
import { ValidationSchemaFactory } from './utils';

// 创建文本验证模式
const textSchema = ValidationSchemaFactory.createTextSchema(1, 100);
const result = textSchema.safeParse('Hello World');

if (result.success) {
  console.log('验证通过:', result.data);
} else {
  console.error('验证失败:', result.error.errors);
}

// 创建数值验证模式
const numberSchema = ValidationSchemaFactory.createNumberSchema(0, 100, true);
const numberResult = numberSchema.safeParse(42);

// 创建枚举验证模式
const statusSchema = ValidationSchemaFactory.createEnumSchema(
  ['pending', 'completed', 'failed'],
  '状态必须是 pending、completed 或 failed'
);
```

## 数据清洗示例

```typescript
import { DataCleaner } from './utils';

// 清理HTML标签
const htmlText = '<p>Hello <strong>World</strong>!</p>';
const cleanText = DataCleaner.stripHtml(htmlText);
console.log('清理后:', cleanText); // "Hello World!"

// 标准化空白字符
const messyText = '  Hello    World  \n\n  ';
const normalizedText = DataCleaner.normalizeWhitespace(messyText);
console.log('标准化后:', normalizedText); // "Hello World"

// 深度清理对象
const dirtyObject = {
  name: '  John  ',
  age: null,
  email: '',
  address: {
    street: '  123 Main St  ',
    city: '',
    country: null
  },
  hobbies: ['reading', '', null, 'swimming']
};

const cleanObject = DataCleaner.deepClean(dirtyObject);
console.log('清理后的对象:', cleanObject);
// 结果: { name: 'John', address: { street: '123 Main St' }, hobbies: ['reading', 'swimming'] }
```

## 格式化示例

```typescript
import { TextFormatter } from './utils';

// 数字格式化
const formattedNumber = TextFormatter.formatNumber(1234.567, 2);
console.log('格式化数字:', formattedNumber); // "1,234.57"

// 货币格式化
const formattedCurrency = TextFormatter.formatCurrency(1234.56, 'CNY');
console.log('格式化货币:', formattedCurrency); // "¥1,234.56"

// 文件大小格式化
const formattedSize = TextFormatter.formatFileSize(1024 * 1024 * 2.5);
console.log('文件大小:', formattedSize); // "2.50 MB"

// 日期时间格式化
const now = new Date();
const formattedDate = TextFormatter.formatDateTime(now, 'datetime');
console.log('格式化日期:', formattedDate);

// 相对时间格式化
const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2小时前
const relativeTime = TextFormatter.formatRelativeTime(pastDate);
console.log('相对时间:', relativeTime); // "2小时前"

// 文本截断
const longText = 'This is a very long text that needs to be truncated';
const truncated = TextFormatter.truncateText(longText, 20);
console.log('截断文本:', truncated); // "This is a very l..."

// 命名转换
const camelCase = TextFormatter.toCamelCase('hello world example');
console.log('驼峰命名:', camelCase); // "helloWorldExample"

const snakeCase = TextFormatter.toSnakeCase('HelloWorldExample');
console.log('下划线命名:', snakeCase); // "hello_world_example"
```

## 数据转换示例

```typescript
import { DataConverter } from './utils';

// CSV 转 JSON
const csvData = `name,age,city
John,25,New York
Jane,30,Los Angeles
Bob,35,Chicago`;

const jsonData = DataConverter.csvToJson(csvData);
console.log('CSV转JSON:', jsonData);
// 结果: [
//   { name: 'John', age: 25, city: 'New York' },
//   { name: 'Jane', age: 30, city: 'Los Angeles' },
//   { name: 'Bob', age: 35, city: 'Chicago' }
// ]

// JSON 转 CSV
const backToCsv = DataConverter.jsonToCsv(jsonData);
console.log('JSON转CSV:', backToCsv);

// 对象扁平化
const nestedObject = {
  user: {
    profile: {
      name: 'John',
      age: 25
    },
    settings: {
      theme: 'dark',
      notifications: true
    }
  }
};

const flattened = DataConverter.flattenObject(nestedObject);
console.log('扁平化对象:', flattened);
// 结果: {
//   'user.profile.name': 'John',
//   'user.profile.age': 25,
//   'user.settings.theme': 'dark',
//   'user.settings.notifications': true
// }

// 数组转对象
const users = [
  { id: '1', name: 'John' },
  { id: '2', name: 'Jane' }
];

const userMap = DataConverter.arrayToObject(users, 'id');
console.log('数组转对象:', userMap);
// 结果: { '1': { id: '1', name: 'John' }, '2': { id: '2', name: 'Jane' } }

// 数组分组
const items = [
  { category: 'fruit', name: 'apple' },
  { category: 'fruit', name: 'banana' },
  { category: 'vegetable', name: 'carrot' }
];

const grouped = DataConverter.groupBy(items, item => item.category);
console.log('分组结果:', grouped);
// 结果: {
//   fruit: [{ category: 'fruit', name: 'apple' }, { category: 'fruit', name: 'banana' }],
//   vegetable: [{ category: 'vegetable', name: 'carrot' }]
// }
```

## 异步控制示例

```typescript
import { AsyncUtils } from './utils';

// 延迟执行
async function delayExample() {
  console.log('开始');
  await AsyncUtils.delay(1000);
  console.log('1秒后执行');
}

// 超时控制
async function timeoutExample() {
  try {
    const result = await AsyncUtils.timeout(
      fetch('https://api.example.com/data'),
      5000 // 5秒超时
    );
    console.log('请求成功:', result);
  } catch (error) {
    console.error('请求超时或失败:', error.message);
  }
}

// 重试机制
async function retryExample() {
  const unstableFunction = async () => {
    if (Math.random() < 0.7) {
      throw new Error('随机失败');
    }
    return '成功';
  };

  try {
    const result = await AsyncUtils.retry(unstableFunction, 3, 1000, true);
    console.log('重试成功:', result);
  } catch (error) {
    console.error('重试失败:', error.message);
  }
}

// 并发控制
async function concurrentExample() {
  const tasks = Array.from({ length: 10 }, (_, i) => 
    () => AsyncUtils.delay(Math.random() * 1000).then(() => `任务${i}完成`)
  );

  const results = await AsyncUtils.concurrent(tasks, 3); // 最多3个并发
  console.log('并发执行结果:', results);
}

// 批处理
async function batchExample() {
  const items = Array.from({ length: 100 }, (_, i) => i);
  
  const processor = async (batch: number[]) => {
    // 模拟批处理
    await AsyncUtils.delay(100);
    return batch.map(item => item * 2);
  };

  const results = await AsyncUtils.batch(items, processor, 10);
  console.log('批处理结果长度:', results.length);
}

// 防抖和节流
const debouncedFunction = AsyncUtils.debounce(async (value: string) => {
  console.log('防抖执行:', value);
}, 300);

const throttledFunction = AsyncUtils.throttle((value: string) => {
  console.log('节流执行:', value);
}, 1000);
```

## 缓存使用示例

```typescript
import { MemoryCache, LRUCache, cached, globalCacheManager } from './utils';

// 基础缓存使用
const cache = new MemoryCache<string>(100, 60000); // 100项，1分钟TTL

// 设置和获取
cache.set('user:123', 'John Doe', 30000); // 30秒TTL
const user = cache.get('user:123');
console.log('缓存用户:', user);

// 缓存统计
const stats = cache.getStats();
console.log('缓存统计:', stats);

// LRU缓存
const lruCache = new LRUCache<string>(50);
lruCache.set('key1', 'value1');
lruCache.set('key2', 'value2');
const value = lruCache.get('key1'); // 会更新访问顺序

// 缓存装饰器
class UserService {
  private cache = new MemoryCache<any>(100, 300000);

  @cached(this.cache, (id: string) => `user:${id}`, 60000)
  async getUser(id: string) {
    // 模拟API调用
    await AsyncUtils.delay(100);
    return { id, name: `User ${id}`, email: `user${id}@example.com` };
  }
}

// 全局缓存管理
const userCache = globalCacheManager.createCache<any>('users', 1000, 300000);
const productCache = globalCacheManager.createCache<any>('products', 500, 600000);

// 清理所有缓存的过期项
const cleanedCount = globalCacheManager.cleanupAll();
console.log('清理的过期项数量:', cleanedCount);
```

## 通用辅助函数示例

```typescript
import {
  generateUUID,
  generateShortId,
  isEmpty,
  isNotEmpty,
  getNestedProperty,
  setNestedProperty,
  chunk,
  shuffle,
  sample,
  range,
  clamp,
  average,
  median,
  memoize,
  singleton
} from './utils';

// ID生成
const uuid = generateUUID();
const shortId = generateShortId(8);
console.log('UUID:', uuid);
console.log('短ID:', shortId);

// 空值检查
console.log('是否为空:', isEmpty('')); // true
console.log('是否为空:', isEmpty([])); // true
console.log('是否为空:', isEmpty({})); // true
console.log('是否非空:', isNotEmpty('hello')); // true

// 嵌套属性操作
const obj = { user: { profile: { name: 'John' } } };
const name = getNestedProperty(obj, 'user.profile.name', 'Unknown');
console.log('嵌套属性:', name); // "John"

setNestedProperty(obj, 'user.profile.age', 25);
console.log('设置后:', obj); // { user: { profile: { name: 'John', age: 25 } } }

// 数组操作
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const chunks = chunk(numbers, 3);
console.log('分块:', chunks); // [[1,2,3], [4,5,6], [7,8,9], [10]]

const shuffled = shuffle(numbers);
console.log('打乱:', shuffled);

const sampled = sample(numbers, 3);
console.log('取样:', sampled);

// 数学计算
const scores = [85, 92, 78, 96, 88];
console.log('平均分:', average(scores)); // 87.8
console.log('中位数:', median(scores)); // 88

// 范围生成
const rangeNumbers = range(1, 10, 2);
console.log('范围:', rangeNumbers); // [1, 3, 5, 7, 9]

// 数值限制
const clampedValue = clamp(150, 0, 100);
console.log('限制后:', clampedValue); // 100

// 记忆化函数
const expensiveFunction = memoize((n: number) => {
  console.log('计算中...', n);
  return n * n;
});

console.log(expensiveFunction(5)); // 计算中... 5, 返回 25
console.log(expensiveFunction(5)); // 直接返回 25（从缓存）

// 单例模式
const createConfig = singleton(() => ({
  apiUrl: 'https://api.example.com',
  timeout: 5000
}));

const config1 = createConfig();
const config2 = createConfig();
console.log('是否为同一实例:', config1 === config2); // true
```

## 错误处理示例

```typescript
import { InputValidator, AsyncUtils, safeJsonParse } from './utils';

// 验证错误处理
function validateUserInput(input: any) {
  try {
    InputValidator.validateStringLength(input.name, 1, 50, '用户名');
    InputValidator.validateNumberRange(input.age, 0, 120, '年龄');
    
    if (!InputValidator.validateEmail(input.email)) {
      throw new Error('邮箱格式无效');
    }
    
    return { success: true, data: input };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 异步错误处理
async function handleAsyncErrors() {
  try {
    // 使用超时和重试
    const result = await AsyncUtils.timeout(
      AsyncUtils.retry(async () => {
        const response = await fetch('/api/data');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      }, 3, 1000),
      10000
    );
    
    return { success: true, data: result };
  } catch (error) {
    console.error('异步操作失败:', error);
    return { success: false, error: error.message };
  }
}

// 安全JSON解析
function parseJsonSafely(jsonString: string) {
  const defaultValue = { error: 'Invalid JSON' };
  const result = safeJsonParse(jsonString, defaultValue);
  
  if (result === defaultValue) {
    console.warn('JSON解析失败，使用默认值');
  }
  
  return result;
}
```

## 性能优化示例

```typescript
import { MemoryCache, AsyncUtils, memoize, debounceSync } from './utils';

// 缓存优化
class DataService {
  private cache = new MemoryCache<any>(1000, 300000);
  
  async getData(id: string) {
    // 先检查缓存
    const cached = this.cache.get(`data:${id}`);
    if (cached) {
      return cached;
    }
    
    // 获取数据
    const data = await this.fetchData(id);
    
    // 缓存结果
    this.cache.set(`data:${id}`, data, 600000); // 10分钟
    
    return data;
  }
  
  private async fetchData(id: string) {
    // 模拟API调用
    await AsyncUtils.delay(100);
    return { id, data: `Data for ${id}` };
  }
}

// 批量处理优化
class BatchProcessor {
  private batchCache = new Map<string, any[]>();
  private processBatch = debounceSync(this.executeBatch.bind(this), 100);
  
  async process(item: any): Promise<any> {
    return new Promise((resolve) => {
      const batchKey = this.getBatchKey(item);
      
      if (!this.batchCache.has(batchKey)) {
        this.batchCache.set(batchKey, []);
      }
      
      this.batchCache.get(batchKey)!.push({ item, resolve });
      this.processBatch();
    });
  }
  
  private getBatchKey(item: any): string {
    // 根据业务逻辑确定批次键
    return item.type || 'default';
  }
  
  private async executeBatch() {
    for (const [batchKey, items] of this.batchCache.entries()) {
      if (items.length > 0) {
        try {
          const results = await this.processBatchItems(items.map(i => i.item));
          
          items.forEach((item, index) => {
            item.resolve(results[index]);
          });
        } catch (error) {
          items.forEach(item => {
            item.resolve({ error: error.message });
          });
        }
        
        this.batchCache.set(batchKey, []);
      }
    }
  }
  
  private async processBatchItems(items: any[]): Promise<any[]> {
    // 批量处理逻辑
    await AsyncUtils.delay(50);
    return items.map(item => ({ ...item, processed: true }));
  }
}
```

## 总结

这些工具函数提供了：

1. **数据验证**：确保输入数据的正确性和安全性
2. **数据清洗**：处理脏数据和格式问题
3. **格式化**：统一数据展示格式
4. **数据转换**：不同格式间的转换
5. **异步控制**：管理异步操作的执行
6. **缓存管理**：提高性能和响应速度
7. **通用辅助**：常用的工具函数

使用这些工具可以显著提高开发效率，减少重复代码，并确保代码质量。记住在实际项目中根据具体需求选择合适的工具和配置。