/**
 * 数据转换工具类
 * 提供各种数据格式转换方法
 */
export class DataConverter {
  /**
   * CSV 转 JSON
   * @param csvText CSV文本
   * @param hasHeader 是否包含表头
   * @returns JSON数组
   */
  static csvToJson(csvText: string, hasHeader: boolean = true): any[] {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = hasHeader 
      ? lines[0].split(',').map(h => h.trim())
      : lines[0].split(',').map((_, i) => `column_${i + 1}`);
    
    const dataLines = hasHeader ? lines.slice(1) : lines;
    
    return dataLines.map(line => {
      const values = this.parseCsvLine(line);
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
  
  /**
   * JSON 转 CSV
   * @param jsonArray JSON数组
   * @param includeHeader 是否包含表头
   * @returns CSV文本
   */
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
        // 如果值包含逗号、引号或换行符，需要用引号包围
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      });
      csvLines.push(values.join(','));
    });
    
    return csvLines.join('\n');
  }
  
  /**
   * 解析CSV行（处理引号和逗号）
   * @param line CSV行
   * @returns 解析后的值数组
   */
  private static parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // 转义的引号
          current += '"';
          i++; // 跳过下一个引号
        } else {
          // 切换引号状态
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // 字段分隔符
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
  
  /**
   * XML 转 JSON（简单实现）
   * @param xmlText XML文本
   * @returns JSON对象
   */
  static xmlToJson(xmlText: string): any {
    // 注意：这是一个简化的实现，生产环境建议使用专业的XML解析库
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // 检查解析错误
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('XML解析错误');
      }
      
      return this.xmlNodeToJson(xmlDoc.documentElement);
    } catch (error) {
      throw new Error(`XML转换失败: ${(error as Error).message}`);
    }
  }
  
  /**
   * XML节点转JSON
   * @param node XML节点
   * @returns JSON对象
   */
  private static xmlNodeToJson(node: Element): any {
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
    const children = Array.from(node.childNodes);
    const textContent = children
      .filter(child => child.nodeType === Node.TEXT_NODE)
      .map(child => child.textContent?.trim())
      .filter(text => text)
      .join(' ');
    
    const elementChildren = children.filter(child => child.nodeType === Node.ELEMENT_NODE) as Element[];
    
    if (textContent && elementChildren.length === 0) {
      // 只有文本内容
      result['#text'] = textContent;
    } else if (elementChildren.length > 0) {
      // 有子元素
      elementChildren.forEach(child => {
        const childJson = this.xmlNodeToJson(child);
        
        if (result[child.nodeName]) {
          // 如果已存在同名节点，转换为数组
          if (!Array.isArray(result[child.nodeName])) {
            result[child.nodeName] = [result[child.nodeName]];
          }
          result[child.nodeName].push(childJson);
        } else {
          result[child.nodeName] = childJson;
        }
      });
    }
    
    return result;
  }
  
  /**
   * 对象扁平化
   * @param obj 要扁平化的对象
   * @param prefix 前缀
   * @param separator 分隔符
   * @returns 扁平化后的对象
   */
  static flattenObject(obj: any, prefix: string = '', separator: string = '.'): any {
    const flattened: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}${separator}${key}` : key;
        
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key] !== null) {
          Object.assign(flattened, this.flattenObject(obj[key], newKey, separator));
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }
    
    return flattened;
  }
  
  /**
   * 对象反扁平化
   * @param obj 扁平化的对象
   * @param separator 分隔符
   * @returns 反扁平化后的对象
   */
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
  
  /**
   * 数组转对象
   * @param array 数组
   * @param keyField 作为键的字段
   * @param valueField 作为值的字段（可选）
   * @returns 转换后的对象
   */
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
  
  /**
   * 对象转数组
   * @param obj 对象
   * @param keyName 键的字段名
   * @param valueName 值的字段名
   * @returns 转换后的数组
   */
  static objectToArray(obj: Record<string, any>, keyName: string = 'key', valueName: string = 'value'): any[] {
    return Object.entries(obj).map(([key, value]) => ({
      [keyName]: key,
      [valueName]: value
    }));
  }
  
  /**
   * 数组分组
   * @param array 数组
   * @param keySelector 分组键选择器
   * @returns 分组后的对象
   */
  static groupBy<T>(array: T[], keySelector: (item: T) => string): Record<string, T[]> {
    const result: Record<string, T[]> = {};
    
    array.forEach(item => {
      const key = keySelector(item);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
    });
    
    return result;
  }
  
  /**
   * 数组去重
   * @param array 数组
   * @param keySelector 唯一键选择器（可选）
   * @returns 去重后的数组
   */
  static unique<T>(array: T[], keySelector?: (item: T) => any): T[] {
    if (!keySelector) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const key = keySelector(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  /**
   * 深度克隆对象
   * @param obj 要克隆的对象
   * @returns 克隆后的对象
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }
    
    if (typeof obj === 'object') {
      const cloned = {} as T;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    
    return obj;
  }
  
  /**
   * 深度合并对象
   * @param target 目标对象
   * @param source 源对象
   * @returns 合并后的对象
   */
  static deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = result[key];
        
        if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
            targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
          result[key] = this.deepMerge(targetValue, sourceValue);
        } else if (sourceValue !== undefined) {
          (result as any)[key] = sourceValue;
        }
      }
    }
    
    return result;
  }
  
  /**
   * 检查是否为对象
   * @param item 要检查的项
   * @returns 是否为对象
   */
  private static isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
}