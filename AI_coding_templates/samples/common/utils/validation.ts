import { z } from 'zod';

/**
 * 通用验证器类
 * 提供常用的数据验证方法
 */
export class InputValidator {
  /**
   * 验证字符串长度
   * @param value 要验证的字符串
   * @param min 最小长度
   * @param max 最大长度
   * @param fieldName 字段名称（用于错误消息）
   */
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
  
  /**
   * 验证数值范围
   * @param value 要验证的数值
   * @param min 最小值
   * @param max 最大值
   * @param fieldName 字段名称
   */
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
  
  /**
   * 验证邮箱格式
   * @param email 邮箱地址
   * @returns 是否为有效邮箱
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * 验证URL格式
   * @param url URL地址
   * @returns 是否为有效URL
   */
  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 验证JSON格式
   * @param jsonString JSON字符串
   * @returns 是否为有效JSON
   */
  static validateJson(jsonString: string): boolean {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 验证文件扩展名
   * @param filename 文件名
   * @param allowedExtensions 允许的扩展名列表
   * @returns 是否为允许的扩展名
   */
  static validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    return ext ? allowedExtensions.includes(ext) : false;
  }
  
  /**
   * 检查是否包含中文字符
   * @param text 文本内容
   * @returns 是否包含中文
   */
  static containsChinese(text: string): boolean {
    return /[\u4e00-\u9fff]/.test(text);
  }
  
  /**
   * 验证中国手机号
   * @param phone 手机号
   * @returns 是否为有效手机号
   */
  static validateChinesePhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }
  
  /**
   * 验证中国身份证号
   * @param idCard 身份证号
   * @returns 是否为有效身份证号
   */
  static validateChineseIdCard(idCard: string): boolean {
    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    return idCardRegex.test(idCard);
  }
}

/**
 * Zod 验证模式工厂
 * 提供常用的 Zod 验证模式创建方法
 */
export class ValidationSchemaFactory {
  /**
   * 创建文本验证模式
   * @param minLength 最小长度
   * @param maxLength 最大长度
   * @param pattern 正则表达式模式
   * @returns Zod 字符串验证模式
   */
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
  
  /**
   * 创建数值验证模式
   * @param min 最小值
   * @param max 最大值
   * @param isInteger 是否必须为整数
   * @returns Zod 数值验证模式
   */
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
  
  /**
   * 创建枚举验证模式
   * @param values 枚举值列表
   * @param errorMessage 自定义错误消息
   * @returns Zod 枚举验证模式
   */
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
  
  /**
   * 创建数组验证模式
   * @param itemSchema 数组项的验证模式
   * @param minLength 最小长度
   * @param maxLength 最大长度
   * @returns Zod 数组验证模式
   */
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