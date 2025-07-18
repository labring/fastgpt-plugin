# FastGPT 插件开发工具函数库

本文档提供了 FastGPT 插件开发中常用的工具函数和辅助类。

## 数据验证工具

### 1. 输入验证器

```typescript
import { z } from 'zod';

// 通用验证器类
export class InputValidator {
  // 验证字符串长度
  static validateStringLength(
    value: string, 
    min: number = 1, 
    max: number = 10000,
    fieldName: string = '字段'
  ): void {
    if (value.length < min) {
      throw new Error(`${fieldName}长度不能少于${min}个字符`);
    }
    if (value.length > max) {
      throw new Error(`${fieldName}长度不能超过${max}个字符`);
    }
  }
  
  // 验证数值范围
  static validateNumberRange(
    value: number, 
    min: number, 
    max: number,
    fieldName: string = '数值'
  ): void {
    if (value < min || value > max) {
      throw new Error(`${fieldName}必须在${min}到${max}之间`);
    }
  }
  
  // 验证邮箱格式
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  // 验证URL格式
  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  // 验证JSON格式
  static validateJson(jsonString: string): boolean {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  }
  
  // 验证文件扩展名
  static validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    return ext ? allowedExtensions.includes(ext) : false;
  }
  
  // 验证中文字符
  static containsChinese(text: string): boolean {
    return /[\u4e00-\u9fff]/.test(text);
  }
  
  // 验证手机号（中国）
  static validateChinesePhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }
  
  // 验证身份证号（中国）
  static validateChineseIdCard(idCard: string): boolean {
    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    return idCardRegex.test(idCard);
  }
}

// Zod 验证模式工厂
export class ValidationSchemaFactory {
  // 创建文本验证模式
  static createTextSchema(
    minLength: number = 1,
    maxLength: number = 10000,
    pattern?: RegExp
  ) {
    let schema = z.string()
      .min(minLength, `文本长度不能少于${minLength}个字符`)
      .max(maxLength, `文本长度不能超过${maxLength}个字符`);
    
    if (pattern) {
      schema = schema.regex(pattern, '文本格式不符合要求');
    }
    
    return schema;
  }
  
  // 创建数值验证模式
  static createNumberSchema(
    min?: number,
    max?: number,
    isInteger: boolean = false
  ) {
    let schema = z.number();
    
    if (isInteger) {
      schema = schema.int('必须是整数');
    }
    
    if (min !== undefined) {
      schema = schema.min(min, `数值不能小于${min}`);
    }
    
    if (max !== undefined) {
      schema = schema.max(max, `数值不能大于${max}`);
    }
    
    return schema;
  }
  
  // 创建枚举验证模式
  static createEnumSchema<T extends string>(
    values: T[],
    errorMessage?: string
  ) {
    return z.enum(values as [T, ...T[]], {
      errorMap: () => ({ 
        message: errorMessage || `值必须是以下之一: ${values.join(', ')}` 
      })
    });
  }
  
  // 创建数组验证模式
  static createArraySchema<T>(
    itemSchema: z.ZodSchema<T>,
    minLength?: number,
    maxLength?: number
  ) {
    let schema = z.array(itemSchema);
    
    if (minLength !== undefined) {
      schema = schema.min(minLength, `数组长度不能少于${minLength}`);
    }
    
    if (maxLength !== undefined) {
      schema = schema.max(maxLength, `数组长度不能超过${maxLength}`);
    }
    
    return schema;
  }
}
```

### 2. 数据清洗工具

```typescript
// 数据清洗工具类
export class DataCleaner {
  // 清理HTML标签
  static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
  
  // 清理多余空格
  static normalizeWhitespace(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 合并多个空格
      .replace(/\n\s*\n/g, '\n') // 合并多个换行
      .trim();
  }
  
  // 移除特殊字符
  static removeSpecialChars(
    text: string, 
    keepChars: string = '.,!?;:()[]{}"\'-'
  ): string {
    const pattern = new RegExp(`[^\\w\\s\\u4e00-\\u9fff${keepChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`, 'g');
    return text.replace(pattern, '');
  }
  
  // 标准化换行符
  static normalizeLineBreaks(text: string): string {
    return text.replace(/\r\n|\r/g, '\n');
  }
  
  // 移除空值
  static removeEmptyValues<T>(obj: Record<string, T>): Record<string, T> {
    const result: Record<string, T> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        result[key] = value;
      }
    }
    
    return result;
  }
  
  // 深度清理对象
  static deepClean(obj: any): any {
    if (Array.isArray(obj)) {
      return obj
        .map(item => this.deepClean(item))
        .filter(item => item !== null && item !== undefined);
    }
    
    if (obj && typeof obj === 'object') {
      const cleaned: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        const cleanedValue = this.deepClean(value);
        if (cleanedValue !== null && cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
      
      return Object.keys(cleaned).length > 0 ? cleaned : null;
    }
    
    if (typeof obj === 'string') {
      const cleaned = this.normalizeWhitespace(obj);
      return cleaned.length > 0 ? cleaned : null;
    }
    
    return obj;
  }
  
  // 清理CSV数据
  static cleanCsvData(csvText: string): string {
    return csvText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  }
  
  // 清理JSON数据
  static cleanJsonData(jsonText: string): string {
    try {
      const parsed = JSON.parse(jsonText);
      const cleaned = this.deepClean(parsed);
      return JSON.stringify(cleaned, null, 2);
    } catch (error) {
      throw new Error(`JSON格式错误: ${error.message}`);
    }
  }
}
```

## 格式化工具

### 1. 文本格式化

```typescript
// 文本格式化工具类
export class TextFormatter {
  // 格式化数字
  static formatNumber(
    num: number, 
    decimals: number = 2,
    locale: string = 'zh-CN'
  ): string {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  }
  
  // 格式化货币
  static formatCurrency(
    amount: number,
    currency: string = 'CNY',
    locale: string = 'zh-CN'
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount);
  }
  
  // 格式化百分比
  static formatPercentage(
    value: number,
    decimals: number = 1,
    locale: string = 'zh-CN'
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }
  
  // 格式化日期时间
  static formatDateTime(
    date: Date | string | number,
    format: 'full' | 'date' | 'time' | 'datetime' = 'datetime',
    locale: string = 'zh-CN'
  ): string {
    const dateObj = new Date(date);
    
    const options: Intl.DateTimeFormatOptions = {
      full: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'long'
      },
      date: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      },
      time: {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      },
      datetime: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }
    };
    
    return new Intl.DateTimeFormat(locale, options[format]).format(dateObj);
  }
  
  // 格式化文件大小
  static formatFileSize(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }
  
  // 格式化持续时间
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}天 ${hours % 24}小时 ${minutes % 60}分钟`;
    } else if (hours > 0) {
      return `${hours}小时 ${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟 ${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  }
  
  // 截断文本
  static truncateText(
    text: string, 
    maxLength: number, 
    suffix: string = '...'
  ): string {
    if (text.length <= maxLength) {
      return text;
    }
    
    return text.substring(0, maxLength - suffix.length) + suffix;
  }
  
  // 首字母大写
  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
  
  // 驼峰命名转换
  static toCamelCase(text: string): string {
    return text
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  }
  
  // 下划线命名转换
  static toSnakeCase(text: string): string {
    return text
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_');
  }
  
  // 短横线命名转换
  static toKebabCase(text: string): string {
    return text
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('-');
  }
}
```

### 2. 数据转换工具

```typescript
// 数据转换工具类
export class DataConverter {
  // CSV 转 JSON
  static csvToJson(csvText: string, hasHeader: boolean = true): any[] {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = hasHeader 
      ? lines[0].split(',').map(h => h.trim())
      : lines[0].split(',').map((_, i) => `column_${i + 1}`);
    
    const dataLines = hasHeader ? lines.slice(1) : lines;
    
    return dataLines.map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        // 尝试转换为数字
        const numValue = Number(value);
        obj[header] = !isNaN(numValue) && value !== '' ? numValue : value;
      });
      
      return obj;
    });
  }
  
  // JSON 转 CSV
  static jsonToCsv(jsonArray: any[], includeHeader: boolean = true): string {
    if (jsonArray.length === 0) return '';
    
    const headers = Object.keys(jsonArray[0]);
    const csvLines: string[] = [];
    
    if (includeHeader) {
      csvLines.push(headers.join(','));
    }
    
    jsonArray.forEach(obj => {
      const values = headers.map(header => {
        const value = obj[header];
        // 如果值包含逗号或引号，需要用引号包围
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvLines.push(values.join(','));
    });
    
    return csvLines.join('\n');
  }
  
  // XML 转 JSON
  static xmlToJson(xmlText: string): any {
    // 简单的XML解析（生产环境建议使用专业的XML解析库）
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    function xmlNodeToJson(node: any): any {
      const result: any = {};
      
      // 处理属性
      if (node.attributes && node.attributes.length > 0) {
        result['@attributes'] = {};
        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes[i];
          result['@attributes'][attr.name] = attr.value;
        }
      }
      
      // 处理子节点
      if (node.childNodes && node.childNodes.length > 0) {
        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i];
          
          if (child.nodeType === 3) { // 文本节点
            const text = child.textContent?.trim();
            if (text) {
              result['#text'] = text;
            }
          } else if (child.nodeType === 1) { // 元素节点
            const childJson = xmlNodeToJson(child);
            
            if (result[child.nodeName]) {
              if (!Array.isArray(result[child.nodeName])) {
                result[child.nodeName] = [result[child.nodeName]];
              }
              result[child.nodeName].push(childJson);
            } else {
              result[child.nodeName] = childJson;
            }
          }
        }
      }
      
      return result;
    }
    
    return xmlNodeToJson(xmlDoc.documentElement);
  }
  
  // 对象扁平化
  static flattenObject(obj: any, prefix: string = '', separator: string = '.'): any {
    const flattened: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}${separator}${key}` : key;
        
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          Object.assign(flattened, this.flattenObject(obj[key], newKey, separator));
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }
    
    return flattened;
  }
  
  // 对象反扁平化
  static unflattenObject(obj: any, separator: string = '.'): any {
    const result: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const keys = key.split(separator);
        let current = result;
        
        for (let i = 0; i < keys.length - 1; i++) {
          const k = keys[i];
          if (!current[k]) {
            current[k] = {};
          }
          current = current[k];
        }
        
        current[keys[keys.length - 1]] = obj[key];
      }
    }
    
    return result;
  }
  
  // 数组转对象
  static arrayToObject<T>(
    array: T[], 
    keyField: keyof T,
    valueField?: keyof T
  ): Record<string, any> {
    const result: Record<string, any> = {};
    
    array.forEach(item => {
      const key = String(item[keyField]);
      const value = valueField ? item[valueField] : item;
      result[key] = value;
    });
    
    return result;
  }
  
  // 对象转数组
  static objectToArray(obj: Record<string, any>, keyName: string = 'key', valueName: string = 'value'): any[] {
    return Object.entries(obj).map(([key, value]) => ({
      [keyName]: key,
      [valueName]: value
    }));
  }
}
```

## 异步处理工具

### 1. 异步控制工具

```typescript
// 异步控制工具类
export class AsyncUtils {
  // 延迟执行
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // 超时控制
  static timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`操作超时 (${ms}ms)`)), ms)
      )
    ]);
  }
  
  // 重试机制
  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000,
    backoff: boolean = true
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        await this.delay(waitTime);
      }
    }
    
    throw lastError!;
  }
  
  // 并发控制
  static async concurrent<T>(
    tasks: (() => Promise<T>)[],
    concurrency: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      const promise = task().then(result => {
        results[i] = result;
      });
      
      executing.push(promise);
      
      if (executing.length >= concurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }
    
    await Promise.all(executing);
    return results;
  }
  
  // 批处理
  static async batch<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = 10
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
    }
    
    return results;
  }
  
  // 队列处理
  static createQueue<T>() {
    const queue: (() => Promise<T>)[] = [];
    let processing = false;
    
    const processQueue = async () => {
      if (processing || queue.length === 0) return;
      
      processing = true;
      
      while (queue.length > 0) {
        const task = queue.shift()!;
        try {
          await task();
        } catch (error) {
          console.error('队列任务执行失败:', error);
        }
      }
      
      processing = false;
    };
    
    return {
      add: (task: () => Promise<T>) => {
        queue.push(task);
        processQueue();
      },
      size: () => queue.length,
      clear: () => queue.splice(0)
    };
  }
  
  // 防抖
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          resolve(func(...args));
        }, wait);
      });
    };
  }
  
  // 节流
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => ReturnType<T> | undefined {
    let lastTime = 0;
    
    return (...args: Parameters<T>): ReturnType<T> | undefined => {
      const now = Date.now();
      
      if (now - lastTime >= wait) {
        lastTime = now;
        return func(...args);
      }
    };
  }
}
```

## 缓存工具

### 1. 内存缓存

```typescript
// 缓存项接口
interface CacheItem<T> {
  value: T;
  expiry: number;
  hits: number;
  created: number;
}

// 内存缓存类
export class MemoryCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private maxSize: number;
  private defaultTTL: number;
  
  constructor(maxSize: number = 1000, defaultTTL: number = 300000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }
  
  // 设置缓存
  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    
    // 如果缓存已满，删除最少使用的项
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastUsed();
    }
    
    this.cache.set(key, {
      value,
      expiry,
      hits: 0,
      created: Date.now()
    });
  }
  
  // 获取缓存
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    // 增加命中次数
    item.hits++;
    
    return item.value;
  }
  
  // 删除缓存
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  // 清空缓存
  clear(): void {
    this.cache.clear();
  }
  
  // 检查是否存在
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  // 获取缓存大小
  size(): number {
    return this.cache.size;
  }
  
  // 获取缓存统计
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalHits: number;
    totalRequests: number;
  } {
    let totalHits = 0;
    let totalRequests = 0;
    
    for (const item of this.cache.values()) {
      totalHits += item.hits;
      totalRequests += item.hits;
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      totalHits,
      totalRequests
    };
  }
  
  // 清理过期项
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
  
  // 驱逐最少使用的项
  private evictLeastUsed(): void {
    let leastUsedKey: string | undefined;
    let leastHits = Infinity;
    let oldestTime = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.hits < leastHits || (item.hits === leastHits && item.created < oldestTime)) {
        leastUsedKey = key;
        leastHits = item.hits;
        oldestTime = item.created;
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }
}

// 缓存装饰器
export function cached<T extends (...args: any[]) => Promise<any>>(
  cache: MemoryCache<any>,
  keyGenerator?: (...args: Parameters<T>) => string,
  ttl?: number
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: Parameters<T>) {
      const key = keyGenerator 
        ? keyGenerator(...args)
        : `${propertyKey}_${JSON.stringify(args)}`;
      
      // 尝试从缓存获取
      const cached = cache.get(key);
      if (cached !== undefined) {
        return cached;
      }
      
      // 执行原方法
      const result = await originalMethod.apply(this, args);
      
      // 缓存结果
      cache.set(key, result, ttl);
      
      return result;
    };
    
    return descriptor;
  };
}
```

## 总结

这些工具函数涵盖了 FastGPT 插件开发中的常见需求：

1. **数据验证**：确保输入数据的正确性
2. **数据清洗**：处理脏数据和格式问题
3. **格式化**：统一数据展示格式
4. **数据转换**：不同格式间的转换
5. **异步处理**：控制异步操作的执行
6. **缓存管理**：提高性能和响应速度

使用这些工具可以：
- 减少重复代码
- 提高开发效率
- 保证代码质量
- 增强系统稳定性

记住：**工具函数应该保持简单、可测试和可复用**。