/**
 * 数据清洗工具类
 * 提供各种数据清洗和标准化方法
 */
export class DataCleaner {
  /**
   * 清理HTML标签
   * @param html HTML字符串
   * @returns 清理后的纯文本
   */
  static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * 标准化空白字符
   * @param text 文本内容
   * @returns 标准化后的文本
   */
  static normalizeWhitespace(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 合并多个空格
      .replace(/\n\s*\n/g, '\n') // 合并多个换行
      .trim();
  }

  /**
   * 移除特殊字符
   * @param text 文本内容
   * @param keepChars 要保留的特殊字符
   * @returns 清理后的文本
   */
  static removeSpecialChars(text: string, keepChars: string = '.,!?;:()[]{}"\'-'): string {
    const pattern = new RegExp(
      `[^\\w\\s\\u4e00-\\u9fff${keepChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`,
      'g'
    );
    return text.replace(pattern, '');
  }

  /**
   * 标准化换行符
   * @param text 文本内容
   * @returns 标准化后的文本
   */
  static normalizeLineBreaks(text: string): string {
    return text.replace(/\r\n|\r/g, '\n');
  }

  /**
   * 移除对象中的空值
   * @param obj 要清理的对象
   * @returns 清理后的对象
   */
  static removeEmptyValues<T>(obj: Record<string, T>): Record<string, T> {
    const result: Record<string, T> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * 深度清理对象（递归清理嵌套对象和数组）
   * @param obj 要清理的对象
   * @returns 清理后的对象
   */
  static deepClean(obj: any): any {
    if (Array.isArray(obj)) {
      return obj
        .map((item) => this.deepClean(item))
        .filter((item) => item !== null && item !== undefined);
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

  /**
   * 清理CSV数据
   * @param csvText CSV文本
   * @returns 清理后的CSV文本
   */
  static cleanCsvData(csvText: string): string {
    return csvText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');
  }

  /**
   * 清理JSON数据
   * @param jsonText JSON文本
   * @returns 清理后的JSON文本
   */
  static cleanJsonData(jsonText: string): string {
    try {
      const parsed = JSON.parse(jsonText);
      const cleaned = this.deepClean(parsed);
      return JSON.stringify(cleaned, null, 2);
    } catch (error) {
      throw new Error(`JSON格式错误: ${(error as Error).message}`);
    }
  }

  /**
   * 清理电话号码（移除非数字字符）
   * @param phone 电话号码
   * @returns 清理后的电话号码
   */
  static cleanPhoneNumber(phone: string): string {
    return phone.replace(/[^\d]/g, '');
  }

  /**
   * 清理邮箱地址（转换为小写并去除空格）
   * @param email 邮箱地址
   * @returns 清理后的邮箱地址
   */
  static cleanEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * 清理URL（确保协议存在）
   * @param url URL地址
   * @returns 清理后的URL
   */
  static cleanUrl(url: string): string {
    const trimmed = url.trim();
    if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }

  /**
   * 清理文件名（移除非法字符）
   * @param filename 文件名
   * @returns 清理后的文件名
   */
  static cleanFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '') // 移除Windows非法字符
      .replace(/\s+/g, '_') // 空格替换为下划线
      .trim();
  }
}
