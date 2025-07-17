import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  InputValidator,
  ValidationSchemaFactory,
  DataCleaner,
  TextFormatter,
  DataConverter,
  AsyncUtils,
  MemoryCache,
  LRUCache,
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
} from './index';

describe('InputValidator', () => {
  it('should validate string length correctly', () => {
    expect(() => InputValidator.validateStringLength('hello', 1, 10)).not.toThrow();
    expect(() => InputValidator.validateStringLength('', 1, 10)).toThrow('字段长度不能少于1个字符');
    expect(() => InputValidator.validateStringLength('a'.repeat(11), 1, 10)).toThrow('字段长度不能超过10个字符');
  });

  it('should validate number range correctly', () => {
    expect(() => InputValidator.validateNumberRange(5, 1, 10)).not.toThrow();
    expect(() => InputValidator.validateNumberRange(0, 1, 10)).toThrow('数值必须在1到10之间');
    expect(() => InputValidator.validateNumberRange(11, 1, 10)).toThrow('数值必须在1到10之间');
  });

  it('should validate email format', () => {
    expect(InputValidator.validateEmail('test@example.com')).toBe(true);
    expect(InputValidator.validateEmail('invalid-email')).toBe(false);
    expect(InputValidator.validateEmail('test@')).toBe(false);
  });

  it('should validate URL format', () => {
    expect(InputValidator.validateUrl('https://example.com')).toBe(true);
    expect(InputValidator.validateUrl('http://example.com')).toBe(true);
    expect(InputValidator.validateUrl('invalid-url')).toBe(false);
  });

  it('should validate JSON format', () => {
    expect(InputValidator.validateJson('{"key": "value"}')).toBe(true);
    expect(InputValidator.validateJson('invalid json')).toBe(false);
  });

  it('should validate file extensions', () => {
    expect(InputValidator.validateFileExtension('test.jpg', ['jpg', 'png'])).toBe(true);
    expect(InputValidator.validateFileExtension('test.gif', ['jpg', 'png'])).toBe(false);
  });

  it('should detect Chinese characters', () => {
    expect(InputValidator.containsChinese('Hello 世界')).toBe(true);
    expect(InputValidator.containsChinese('Hello World')).toBe(false);
  });

  it('should validate Chinese phone numbers', () => {
    expect(InputValidator.validateChinesePhone('13812345678')).toBe(true);
    expect(InputValidator.validateChinesePhone('12345678901')).toBe(false);
    expect(InputValidator.validateChinesePhone('1381234567')).toBe(false);
  });
});

describe('ValidationSchemaFactory', () => {
  it('should create text schema', () => {
    const schema = ValidationSchemaFactory.createTextSchema(1, 10);
    expect(schema.safeParse('hello').success).toBe(true);
    expect(schema.safeParse('').success).toBe(false);
    expect(schema.safeParse('a'.repeat(11)).success).toBe(false);
  });

  it('should create number schema', () => {
    const schema = ValidationSchemaFactory.createNumberSchema(0, 100, true);
    expect(schema.safeParse(50).success).toBe(true);
    expect(schema.safeParse(50.5).success).toBe(false); // 必须是整数
    expect(schema.safeParse(-1).success).toBe(false);
    expect(schema.safeParse(101).success).toBe(false);
  });

  it('should create enum schema', () => {
    const schema = ValidationSchemaFactory.createEnumSchema(['a', 'b', 'c']);
    expect(schema.safeParse('a').success).toBe(true);
    expect(schema.safeParse('d').success).toBe(false);
  });

  it('should create array schema', () => {
    const itemSchema = ValidationSchemaFactory.createTextSchema(1, 5);
    const arraySchema = ValidationSchemaFactory.createArraySchema(itemSchema, 1, 3);
    
    expect(arraySchema.safeParse(['a', 'b']).success).toBe(true);
    expect(arraySchema.safeParse([]).success).toBe(false); // 最小长度1
    expect(arraySchema.safeParse(['a', 'b', 'c', 'd']).success).toBe(false); // 最大长度3
  });
});

describe('DataCleaner', () => {
  it('should strip HTML tags', () => {
    const html = '<p>Hello <strong>World</strong>!</p>';
    expect(DataCleaner.stripHtml(html)).toBe('Hello World!');
  });

  it('should normalize whitespace', () => {
    const text = '  Hello    World  \n\n  ';
    expect(DataCleaner.normalizeWhitespace(text)).toBe('Hello World');
  });

  it('should remove special characters', () => {
    const text = 'Hello@#$%World!';
    expect(DataCleaner.removeSpecialChars(text, '!')).toBe('HelloWorld!');
  });

  it('should normalize line breaks', () => {
    const text = 'Line1\r\nLine2\rLine3\nLine4';
    expect(DataCleaner.normalizeLineBreaks(text)).toBe('Line1\nLine2\nLine3\nLine4');
  });

  it('should remove empty values', () => {
    const obj = { a: 'value', b: '', c: null, d: undefined, e: 'another' };
    const cleaned = DataCleaner.removeEmptyValues(obj);
    expect(cleaned).toEqual({ a: 'value', e: 'another' });
  });

  it('should deep clean objects', () => {
    const obj = {
      name: '  John  ',
      age: null,
      address: {
        street: '  123 Main St  ',
        city: '',
        country: null
      },
      hobbies: ['reading', '', null, 'swimming']
    };
    
    const cleaned = DataCleaner.deepClean(obj);
    expect(cleaned).toEqual({
      name: 'John',
      address: { street: '123 Main St' },
      hobbies: ['reading', 'swimming']
    });
  });

  it('should clean CSV data', () => {
    const csv = '\n  line1  \n\n  line2  \n  \n';
    expect(DataCleaner.cleanCsvData(csv)).toBe('line1\nline2');
  });

  it('should clean phone numbers', () => {
    expect(DataCleaner.cleanPhoneNumber('(123) 456-7890')).toBe('1234567890');
  });

  it('should clean email addresses', () => {
    expect(DataCleaner.cleanEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
  });

  it('should clean URLs', () => {
    expect(DataCleaner.cleanUrl('example.com')).toBe('https://example.com');
    expect(DataCleaner.cleanUrl('https://example.com')).toBe('https://example.com');
  });

  it('should clean filenames', () => {
    expect(DataCleaner.cleanFilename('file<>name?.txt')).toBe('filename.txt');
    expect(DataCleaner.cleanFilename('file name.txt')).toBe('file_name.txt');
  });
});

describe('TextFormatter', () => {
  it('should format numbers', () => {
    expect(TextFormatter.formatNumber(1234.567, 2)).toBe('1,234.57');
  });

  it('should format currency', () => {
    const formatted = TextFormatter.formatCurrency(1234.56, 'CNY');
    expect(formatted).toContain('1,234.56');
  });

  it('should format percentages', () => {
    const formatted = TextFormatter.formatPercentage(0.1234, 1);
    expect(formatted).toContain('12.3');
  });

  it('should format file sizes', () => {
    expect(TextFormatter.formatFileSize(0)).toBe('0 Bytes');
    expect(TextFormatter.formatFileSize(1024)).toBe('1.00 KB');
    expect(TextFormatter.formatFileSize(1024 * 1024)).toBe('1.00 MB');
  });

  it('should format duration', () => {
    expect(TextFormatter.formatDuration(1000)).toBe('1秒');
    expect(TextFormatter.formatDuration(60000)).toBe('1分钟 0秒');
    expect(TextFormatter.formatDuration(3600000)).toBe('1小时 0分钟');
  });

  it('should truncate text', () => {
    const text = 'This is a long text';
    expect(TextFormatter.truncateText(text, 10)).toBe('This is...');
    expect(TextFormatter.truncateText(text, 50)).toBe(text);
  });

  it('should capitalize text', () => {
    expect(TextFormatter.capitalize('hello world')).toBe('Hello world');
  });

  it('should convert to camelCase', () => {
    expect(TextFormatter.toCamelCase('hello world')).toBe('helloWorld');
    expect(TextFormatter.toCamelCase('Hello World Example')).toBe('helloWorldExample');
  });

  it('should convert to snake_case', () => {
    expect(TextFormatter.toSnakeCase('HelloWorld')).toBe('hello_world');
    expect(TextFormatter.toSnakeCase('hello world')).toBe('hello_world');
  });

  it('should convert to kebab-case', () => {
    expect(TextFormatter.toKebabCase('HelloWorld')).toBe('hello-world');
    expect(TextFormatter.toKebabCase('hello world')).toBe('hello-world');
  });

  it('should format phone numbers', () => {
    expect(TextFormatter.formatPhoneNumber('13812345678')).toBe('138 1234 5678');
    expect(TextFormatter.formatPhoneNumber('13812345678', 'international')).toBe('+86 138 1234 5678');
  });

  it('should format bank card numbers', () => {
    const formatted = TextFormatter.formatBankCard('1234567890123456');
    expect(formatted).toBe('1234 ******** 3456');
  });
});

describe('DataConverter', () => {
  it('should convert CSV to JSON', () => {
    const csv = 'name,age\nJohn,25\nJane,30';
    const json = DataConverter.csvToJson(csv);
    expect(json).toEqual([
      { name: 'John', age: 25 },
      { name: 'Jane', age: 30 }
    ]);
  });

  it('should convert JSON to CSV', () => {
    const json = [
      { name: 'John', age: 25 },
      { name: 'Jane', age: 30 }
    ];
    const csv = DataConverter.jsonToCsv(json);
    expect(csv).toBe('name,age\nJohn,25\nJane,30');
  });

  it('should flatten objects', () => {
    const obj = {
      user: {
        profile: { name: 'John', age: 25 },
        settings: { theme: 'dark' }
      }
    };
    
    const flattened = DataConverter.flattenObject(obj);
    expect(flattened).toEqual({
      'user.profile.name': 'John',
      'user.profile.age': 25,
      'user.settings.theme': 'dark'
    });
  });

  it('should unflatten objects', () => {
    const flattened = {
      'user.profile.name': 'John',
      'user.profile.age': 25,
      'user.settings.theme': 'dark'
    };
    
    const unflattened = DataConverter.unflattenObject(flattened);
    expect(unflattened).toEqual({
      user: {
        profile: { name: 'John', age: 25 },
        settings: { theme: 'dark' }
      }
    });
  });

  it('should convert array to object', () => {
    const array = [
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' }
    ];
    
    const obj = DataConverter.arrayToObject(array, 'id');
    expect(obj).toEqual({
      '1': { id: '1', name: 'John' },
      '2': { id: '2', name: 'Jane' }
    });
  });

  it('should convert object to array', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const array = DataConverter.objectToArray(obj);
    expect(array).toEqual([
      { key: 'a', value: 1 },
      { key: 'b', value: 2 },
      { key: 'c', value: 3 }
    ]);
  });

  it('should group array by key', () => {
    const array = [
      { category: 'fruit', name: 'apple' },
      { category: 'fruit', name: 'banana' },
      { category: 'vegetable', name: 'carrot' }
    ];
    
    const grouped = DataConverter.groupBy(array, item => item.category);
    expect(grouped).toEqual({
      fruit: [
        { category: 'fruit', name: 'apple' },
        { category: 'fruit', name: 'banana' }
      ],
      vegetable: [
        { category: 'vegetable', name: 'carrot' }
      ]
    });
  });

  it('should remove duplicates from array', () => {
    const array = [1, 2, 2, 3, 3, 4];
    expect(DataConverter.unique(array)).toEqual([1, 2, 3, 4]);
    
    const objArray = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
      { id: 1, name: 'John' }
    ];
    
    const unique = DataConverter.unique(objArray, item => item.id);
    expect(unique).toEqual([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ]);
  });

  it('should deep clone objects', () => {
    const original = {
      name: 'John',
      hobbies: ['reading', 'swimming'],
      address: { city: 'New York' }
    };
    
    const cloned = DataConverter.deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.hobbies).not.toBe(original.hobbies);
    expect(cloned.address).not.toBe(original.address);
  });

  it('should deep merge objects', () => {
    const target = {
      a: 1,
      b: { c: 2, d: 3 }
    };
    
    const source = {
      b: { c: 2, d: 4, e: 5 },
      f: 6
    };
    
    const merged = DataConverter.deepMerge(target, source);
    expect(merged).toEqual({
      a: 1,
      b: { c: 2, d: 4, e: 5 },
      f: 6
    });
  });
});

describe('AsyncUtils', () => {
  it('should delay execution', async () => {
    const start = Date.now();
    await AsyncUtils.delay(100);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(90);
  });

  it('should timeout promises', async () => {
    const slowPromise = new Promise(resolve => setTimeout(resolve, 200));
    
    await expect(AsyncUtils.timeout(slowPromise, 100))
      .rejects.toThrow('操作超时');
  });

  it('should retry failed operations', async () => {
    let attempts = 0;
    const unstableFunction = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('失败');
      }
      return '成功';
    };
    
    const result = await AsyncUtils.retry(unstableFunction, 3, 10);
    expect(result).toBe('成功');
    expect(attempts).toBe(3);
  });

  it('should control concurrency', async () => {
    const tasks = Array.from({ length: 5 }, (_, i) => 
      () => AsyncUtils.delay(50).then(() => i)
    );
    
    const start = Date.now();
    const results = await AsyncUtils.concurrent(tasks, 2);
    const end = Date.now();
    
    expect(results).toEqual([0, 1, 2, 3, 4]);
    // 应该比串行执行快，但比完全并行慢
    expect(end - start).toBeGreaterThan(100);
    expect(end - start).toBeLessThan(250);
  });

  it('should process in batches', async () => {
    const items = [1, 2, 3, 4, 5];
    const processor = async (batch: number[]) => {
      await AsyncUtils.delay(10);
      return batch.map(x => x * 2);
    };
    
    const results = await AsyncUtils.batch(items, processor, 2);
    expect(results).toEqual([2, 4, 6, 8, 10]);
  });

  it('should create and manage queues', async () => {
    const queue = AsyncUtils.createQueue<void>();
    const results: string[] = [];
    
    queue.add(async () => {
      await AsyncUtils.delay(10);
      results.push('task1');
    });
    
    queue.add(async () => {
      await AsyncUtils.delay(10);
      results.push('task2');
    });
    
    // 等待队列处理完成
    await AsyncUtils.delay(50);
    
    expect(results).toEqual(['task1', 'task2']);
  });

  it('should debounce function calls', async () => {
    let callCount = 0;
    const debouncedFn = AsyncUtils.debounce(async (value: string) => {
      callCount++;
      return value;
    }, 50);
    
    // 快速连续调用
    debouncedFn('a');
    debouncedFn('b');
    const result = await debouncedFn('c');
    
    expect(result).toBe('c');
    expect(callCount).toBe(1);
  });

  it('should throttle function calls', () => {
    let callCount = 0;
    const throttledFn = AsyncUtils.throttle(() => {
      callCount++;
    }, 100);
    
    // 快速连续调用
    throttledFn();
    throttledFn();
    throttledFn();
    
    expect(callCount).toBe(1);
  });

  it('should create cancellable promises', async () => {
    const { promise, cancel } = AsyncUtils.cancellable<string>((resolve) => {
      setTimeout(() => resolve('完成'), 100);
    });
    
    cancel();
    
    await expect(promise).rejects.toThrow('操作已取消');
  });

  it('should race for first success', async () => {
    const promises = [
      Promise.reject(new Error('失败1')),
      AsyncUtils.delay(50).then(() => '成功'),
      Promise.reject(new Error('失败2'))
    ];
    
    const result = await AsyncUtils.raceSuccess(promises);
    expect(result).toBe('成功');
  });

  it('should use semaphore for concurrency control', async () => {
    const tasks = Array.from({ length: 5 }, (_, i) => 
      () => AsyncUtils.delay(50).then(() => i)
    );
    
    const start = Date.now();
    const results = await AsyncUtils.withSemaphore(tasks, 2);
    const end = Date.now();
    
    expect(results).toEqual([0, 1, 2, 3, 4]);
    expect(end - start).toBeGreaterThan(100);
  });

  it('should create async iterators', async () => {
    const items = [1, 2, 3];
    const processor = async (item: number) => {
      await AsyncUtils.delay(10);
      return item * 2;
    };
    
    const iterator = AsyncUtils.asyncIterator(items, processor);
    const results = await AsyncUtils.toArray(iterator);
    
    expect(results).toEqual([2, 4, 6]);
  });
});

describe('MemoryCache', () => {
  let cache: MemoryCache<string>;

  beforeEach(() => {
    cache = new MemoryCache<string>(3, 100); // 3项，100ms TTL
  });

  it('should set and get values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('should respect TTL', async () => {
    cache.set('key1', 'value1', 50);
    expect(cache.get('key1')).toBe('value1');
    
    await AsyncUtils.delay(60);
    expect(cache.get('key1')).toBeUndefined();
  });

  it('should evict least used items when full', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    
    // 访问key1和key2
    cache.get('key1');
    cache.get('key2');
    
    // 添加第4个项，应该驱逐key3
    cache.set('key4', 'value4');
    
    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBe('value2');
    expect(cache.get('key3')).toBeUndefined();
    expect(cache.get('key4')).toBe('value4');
  });

  it('should provide cache statistics', () => {
    cache.set('key1', 'value1');
    cache.get('key1');
    cache.get('key1');
    cache.get('nonexistent');
    
    const stats = cache.getStats();
    expect(stats.size).toBe(1);
    expect(stats.maxSize).toBe(3);
    expect(stats.totalHits).toBe(2);
    expect(stats.totalRequests).toBe(3);
  });

  it('should cleanup expired items', async () => {
    cache.set('key1', 'value1', 50);
    cache.set('key2', 'value2', 200);
    
    await AsyncUtils.delay(60);
    
    const cleaned = cache.cleanup();
    expect(cleaned).toBe(1);
    expect(cache.size()).toBe(1);
    expect(cache.get('key2')).toBe('value2');
  });

  it('should update TTL', () => {
    cache.set('key1', 'value1', 50);
    const updated = cache.updateTTL('key1', 200);
    expect(updated).toBe(true);
    
    const nonexistentUpdate = cache.updateTTL('nonexistent', 200);
    expect(nonexistentUpdate).toBe(false);
  });

  it('should provide item info', () => {
    cache.set('key1', 'value1');
    cache.get('key1');
    
    const info = cache.getItemInfo('key1');
    expect(info).toBeDefined();
    expect(info!.hits).toBe(1);
    expect(info!.created).toBeGreaterThan(0);
    expect(info!.expiry).toBeGreaterThan(Date.now());
  });
});

describe('LRUCache', () => {
  let cache: LRUCache<string>;

  beforeEach(() => {
    cache = new LRUCache<string>(3);
  });

  it('should maintain LRU order', () => {
    cache.set('a', 'value1');
    cache.set('b', 'value2');
    cache.set('c', 'value3');
    
    // 访问a，使其成为最近使用的
    cache.get('a');
    
    // 添加新项，应该驱逐b
    cache.set('d', 'value4');
    
    expect(cache.get('a')).toBe('value1');
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe('value3');
    expect(cache.get('d')).toBe('value4');
  });
});

describe('Common Helpers', () => {
  it('should generate UUIDs', () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    
    expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(uuid1).not.toBe(uuid2);
  });

  it('should generate short IDs', () => {
    const id1 = generateShortId(8);
    const id2 = generateShortId(8);
    
    expect(id1).toHaveLength(8);
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('should check for empty values', () => {
    expect(isEmpty('')).toBe(true);
    expect(isEmpty([])).toBe(true);
    expect(isEmpty({})).toBe(true);
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty('hello')).toBe(false);
    expect(isEmpty([1])).toBe(false);
    expect(isEmpty({ a: 1 })).toBe(false);
  });

  it('should check for non-empty values', () => {
    expect(isNotEmpty('hello')).toBe(true);
    expect(isNotEmpty([1])).toBe(true);
    expect(isNotEmpty({ a: 1 })).toBe(true);
    expect(isNotEmpty('')).toBe(false);
    expect(isNotEmpty([])).toBe(false);
    expect(isNotEmpty({})).toBe(false);
  });

  it('should get nested properties', () => {
    const obj = { user: { profile: { name: 'John' } } };
    
    expect(getNestedProperty(obj, 'user.profile.name')).toBe('John');
    expect(getNestedProperty(obj, 'user.profile.age', 'Unknown')).toBe('Unknown');
    expect(getNestedProperty(obj, 'nonexistent.path', 'Default')).toBe('Default');
  });

  it('should set nested properties', () => {
    const obj: any = {};
    
    setNestedProperty(obj, 'user.profile.name', 'John');
    setNestedProperty(obj, 'user.profile.age', 25);
    
    expect(obj).toEqual({
      user: {
        profile: {
          name: 'John',
          age: 25
        }
      }
    });
  });

  it('should chunk arrays', () => {
    const array = [1, 2, 3, 4, 5, 6, 7];
    const chunks = chunk(array, 3);
    
    expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  it('should shuffle arrays', () => {
    const array = [1, 2, 3, 4, 5];
    const shuffled = shuffle(array);
    
    expect(shuffled).toHaveLength(5);
    expect(shuffled).toContain(1);
    expect(shuffled).toContain(2);
    expect(shuffled).toContain(3);
    expect(shuffled).toContain(4);
    expect(shuffled).toContain(5);
    // 原数组不应该被修改
    expect(array).toEqual([1, 2, 3, 4, 5]);
  });

  it('should sample arrays', () => {
    const array = [1, 2, 3, 4, 5];
    const sampled = sample(array, 3);
    
    expect(sampled).toHaveLength(3);
    sampled.forEach(item => {
      expect(array).toContain(item);
    });
  });

  it('should generate ranges', () => {
    expect(range(1, 5)).toEqual([1, 2, 3, 4]);
    expect(range(0, 10, 2)).toEqual([0, 2, 4, 6, 8]);
    expect(range(5, 5)).toEqual([]);
  });

  it('should clamp values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('should calculate averages', () => {
    expect(average([1, 2, 3, 4, 5])).toBe(3);
    expect(average([10, 20, 30])).toBe(20);
    expect(average([])).toBe(0);
  });

  it('should calculate medians', () => {
    expect(median([1, 2, 3, 4, 5])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([5, 1, 3, 2, 4])).toBe(3);
    expect(median([])).toBe(0);
  });

  it('should memoize functions', () => {
    let callCount = 0;
    const expensiveFunction = (n: number) => {
      callCount++;
      return n * n;
    };
    
    const memoized = memoize(expensiveFunction);
    
    expect(memoized(5)).toBe(25);
    expect(memoized(5)).toBe(25);
    expect(memoized(3)).toBe(9);
    expect(memoized(5)).toBe(25);
    
    expect(callCount).toBe(2); // 只调用了两次：5和3
  });

  it('should create singletons', () => {
    let createCount = 0;
    const createInstance = singleton(() => {
      createCount++;
      return { id: createCount };
    });
    
    const instance1 = createInstance();
    const instance2 = createInstance();
    
    expect(instance1).toBe(instance2);
    expect(createCount).toBe(1);
  });
});

describe('Integration Tests', () => {
  it('should work together in a real scenario', async () => {
    // 创建缓存
    const cache = new MemoryCache<any>(100, 60000);
    
    // 模拟API服务
    class ApiService {
      async fetchUser(id: string) {
        // 检查缓存
        const cacheKey = `user:${id}`;
        const cached = cache.get(cacheKey);
        if (cached) {
          return cached;
        }
        
        // 模拟API调用
        await AsyncUtils.delay(100);
        
        // 验证输入
        InputValidator.validateStringLength(id, 1, 50, '用户ID');
        
        // 生成用户数据
        const userData = {
          id,
          name: `User ${id}`,
          email: `user${id}@example.com`,
          createdAt: new Date().toISOString()
        };
        
        // 缓存结果
        cache.set(cacheKey, userData, 30000);
        
        return userData;
      }
      
      async processUsers(userIds: string[]) {
        // 批量处理
        return AsyncUtils.batch(
          userIds,
          async (batch) => {
            const tasks = batch.map(id => () => this.fetchUser(id));
            return AsyncUtils.concurrent(tasks, 3);
          },
          5
        );
      }
    }
    
    const apiService = new ApiService();
    
    // 测试单个用户获取
    const user1 = await apiService.fetchUser('123');
    expect(user1.id).toBe('123');
    expect(user1.name).toBe('User 123');
    
    // 测试缓存命中
    const user1Cached = await apiService.fetchUser('123');
    expect(user1Cached).toBe(user1); // 应该是同一个对象
    
    // 测试批量处理
    const userIds = Array.from({ length: 10 }, (_, i) => `user${i}`);
    const users = await apiService.processUsers(userIds);
    
    expect(users).toHaveLength(10);
    expect(users[0].id).toBe('user0');
    
    // 验证缓存统计
    const stats = cache.getStats();
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.totalHits).toBeGreaterThan(0);
  });
});