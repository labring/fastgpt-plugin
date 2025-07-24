/**
 * 通用辅助函数
 * 提供常用的小工具函数
 */

/**
 * 生成随机字符串
 * @param length 长度
 * @param charset 字符集
 * @returns 随机字符串
 */
export function generateRandomString(
  length: number = 8,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

/**
 * 生成UUID
 * @returns UUID字符串
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 生成短ID
 * @param length 长度
 * @returns 短ID
 */
export function generateShortId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return generateRandomString(length, chars);
}

/**
 * 安全的JSON解析
 * @param jsonString JSON字符串
 * @param defaultValue 默认值
 * @returns 解析结果或默认值
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
}

/**
 * 安全的JSON字符串化
 * @param obj 对象
 * @param defaultValue 默认值
 * @returns JSON字符串或默认值
 */
export function safeJsonStringify(obj: any, defaultValue: string = '{}'): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return defaultValue;
  }
}

/**
 * 检查是否为空值
 * @param value 值
 * @returns 是否为空
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * 检查是否为非空值
 * @param value 值
 * @returns 是否为非空
 */
export function isNotEmpty(value: any): boolean {
  return !isEmpty(value);
}

/**
 * 获取嵌套对象属性
 * @param obj 对象
 * @param path 路径（如 'a.b.c'）
 * @param defaultValue 默认值
 * @returns 属性值或默认值
 */
export function getNestedProperty(obj: any, path: string, defaultValue: any = undefined): any {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }

  return current;
}

/**
 * 设置嵌套对象属性
 * @param obj 对象
 * @param path 路径
 * @param value 值
 */
export function setNestedProperty(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * 删除嵌套对象属性
 * @param obj 对象
 * @param path 路径
 * @returns 是否删除成功
 */
export function deleteNestedProperty(obj: any, path: string): boolean {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      return false;
    }
    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey in current) {
    delete current[lastKey];
    return true;
  }

  return false;
}

/**
 * 数组分块
 * @param array 数组
 * @param size 块大小
 * @returns 分块后的数组
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * 数组随机打乱
 * @param array 数组
 * @returns 打乱后的新数组
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 数组随机取样
 * @param array 数组
 * @param count 取样数量
 * @returns 取样结果
 */
export function sample<T>(array: T[], count: number): T[] {
  const shuffled = shuffle(array);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * 范围生成器
 * @param start 开始值
 * @param end 结束值
 * @param step 步长
 * @returns 数字数组
 */
export function range(start: number, end: number, step: number = 1): number[] {
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}

/**
 * 限制数值范围
 * @param value 值
 * @param min 最小值
 * @param max 最大值
 * @returns 限制后的值
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 线性插值
 * @param start 开始值
 * @param end 结束值
 * @param factor 插值因子（0-1）
 * @returns 插值结果
 */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * clamp(factor, 0, 1);
}

/**
 * 映射数值范围
 * @param value 值
 * @param fromMin 原始最小值
 * @param fromMax 原始最大值
 * @param toMin 目标最小值
 * @param toMax 目标最大值
 * @returns 映射后的值
 */
export function mapRange(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
): number {
  const factor = (value - fromMin) / (fromMax - fromMin);
  return lerp(toMin, toMax, factor);
}

/**
 * 计算数组平均值
 * @param numbers 数字数组
 * @returns 平均值
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}

/**
 * 计算数组中位数
 * @param numbers 数字数组
 * @returns 中位数
 */
export function median(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * 计算标准差
 * @param numbers 数字数组
 * @returns 标准差
 */
export function standardDeviation(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const avg = average(numbers);
  const squaredDiffs = numbers.map((num) => Math.pow(num - avg, 2));
  const avgSquaredDiff = average(squaredDiffs);

  return Math.sqrt(avgSquaredDiff);
}

/**
 * 创建防抖函数（同步版本）
 * @param func 函数
 * @param delay 延迟时间
 * @returns 防抖函数
 */
export function debounceSync<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * 创建节流函数（同步版本）
 * @param func 函数
 * @param delay 延迟时间
 * @returns 节流函数
 */
export function throttleSync<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * 创建记忆化函数
 * @param func 函数
 * @param keyGenerator 键生成器
 * @returns 记忆化函数
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);

    return result;
  }) as T;
}

/**
 * 创建单例函数
 * @param func 构造函数
 * @returns 单例函数
 */
export function singleton<T>(func: () => T): () => T {
  let instance: T;
  let created = false;

  return () => {
    if (!created) {
      instance = func();
      created = true;
    }
    return instance;
  };
}

/**
 * 重试函数（同步版本）
 * @param func 函数
 * @param maxAttempts 最大尝试次数
 * @returns 重试函数
 */
export function retrySync<T>(func: () => T, maxAttempts: number = 3): T {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return func();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxAttempts) {
        throw lastError;
      }
    }
  }

  throw lastError!;
}

/**
 * 类型守卫：检查是否为字符串
 * @param value 值
 * @returns 是否为字符串
 */
export function isString(value: any): value is string {
  return typeof value === 'string';
}

/**
 * 类型守卫：检查是否为数字
 * @param value 值
 * @returns 是否为数字
 */
export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * 类型守卫：检查是否为布尔值
 * @param value 值
 * @returns 是否为布尔值
 */
export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 类型守卫：检查是否为对象
 * @param value 值
 * @returns 是否为对象
 */
export function isObject(value: any): value is object {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * 类型守卫：检查是否为数组
 * @param value 值
 * @returns 是否为数组
 */
export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

/**
 * 类型守卫：检查是否为函数
 * @param value 值
 * @returns 是否为函数
 */
export function isFunction(value: any): value is (...args: any[]) => any {
  return typeof value === 'function';
}

/**
 * 类型守卫：检查是否为日期
 * @param value 值
 * @returns 是否为日期
 */
export function isDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * 类型守卫：检查是否为Promise
 * @param value 值
 * @returns 是否为Promise
 */
export function isPromise(value: any): value is Promise<any> {
  return value && typeof value.then === 'function';
}
