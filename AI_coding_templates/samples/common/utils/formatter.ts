/**
 * 文本格式化工具类
 * 提供各种文本和数据格式化方法
 */
export class TextFormatter {
  /**
   * 格式化数字
   * @param num 数字
   * @param decimals 小数位数
   * @param locale 地区设置
   * @returns 格式化后的数字字符串
   */
  static formatNumber(num: number, decimals: number = 2, locale: string = 'zh-CN'): string {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  }

  /**
   * 格式化货币
   * @param amount 金额
   * @param currency 货币代码
   * @param locale 地区设置
   * @returns 格式化后的货币字符串
   */
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

  /**
   * 格式化百分比
   * @param value 数值（0-1之间）
   * @param decimals 小数位数
   * @param locale 地区设置
   * @returns 格式化后的百分比字符串
   */
  static formatPercentage(value: number, decimals: number = 1, locale: string = 'zh-CN'): string {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  /**
   * 格式化日期时间
   * @param date 日期对象、字符串或时间戳
   * @param format 格式类型
   * @param locale 地区设置
   * @returns 格式化后的日期时间字符串
   */
  static formatDateTime(
    date: Date | string | number,
    format: 'full' | 'date' | 'time' | 'datetime' = 'datetime',
    locale: string = 'zh-CN'
  ): string {
    const dateObj = new Date(date);

    const options: Record<string, Intl.DateTimeFormatOptions> = {
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

  /**
   * 格式化文件大小
   * @param bytes 字节数
   * @param decimals 小数位数
   * @returns 格式化后的文件大小字符串
   */
  static formatFileSize(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    // 保留指定的小数位数，不使用parseFloat移除尾随零
    return (bytes / Math.pow(k, i)).toFixed(decimals) + ' ' + sizes[i];
  }

  /**
   * 格式化持续时间
   * @param milliseconds 毫秒数
   * @returns 格式化后的持续时间字符串
   */
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

  /**
   * 截断文本
   * @param text 文本内容
   * @param maxLength 最大长度
   * @param suffix 后缀
   * @returns 截断后的文本
   */
  static truncateText(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * 首字母大写
   * @param text 文本内容
   * @returns 首字母大写的文本
   */
  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * 转换为驼峰命名
   * @param text 文本内容
   * @returns 驼峰命名的文本
   */
  static toCamelCase(text: string): string {
    return text
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  }

  /**
   * 转换为下划线命名
   * @param text 文本内容
   * @returns 下划线命名的文本
   */
  static toSnakeCase(text: string): string {
    return text
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map((word) => word.toLowerCase())
      .join('_');
  }

  /**
   * 转换为短横线命名
   * @param text 文本内容
   * @returns 短横线命名的文本
   */
  static toKebabCase(text: string): string {
    return text
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map((word) => word.toLowerCase())
      .join('-');
  }

  /**
   * 格式化相对时间
   * @param date 日期
   * @param locale 地区设置
   * @returns 相对时间字符串
   */
  static formatRelativeTime(date: Date | string | number, locale: string = 'zh-CN'): string {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (Math.abs(diffInSeconds) < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (Math.abs(diffInSeconds) < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (Math.abs(diffInSeconds) < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (Math.abs(diffInSeconds) < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
  }

  /**
   * 格式化电话号码
   * @param phone 电话号码
   * @param format 格式类型
   * @returns 格式化后的电话号码
   */
  static formatPhoneNumber(
    phone: string,
    format: 'standard' | 'international' = 'standard'
  ): string {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // 中国手机号
      if (format === 'international') {
        return `+86 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 7)} ${cleaned.substring(7)}`;
      } else {
        return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 7)} ${cleaned.substring(7)}`;
      }
    }

    return phone; // 如果格式不匹配，返回原始值
  }

  /**
   * 格式化银行卡号
   * @param cardNumber 银行卡号
   * @param maskLength 掩码长度
   * @returns 格式化后的银行卡号
   */
  static formatBankCard(cardNumber: string, maskLength: number = 4): string {
    const cleaned = cardNumber.replace(/\D/g, '');

    if (cleaned.length < maskLength * 2) {
      return cleaned; // 如果卡号太短，直接返回
    }

    const firstPart = cleaned.substring(0, maskLength);
    const lastPart = cleaned.substring(cleaned.length - maskLength);
    const middleLength = cleaned.length - maskLength * 2;

    // 创建连续的星号掩码
    const maskedMiddle = '*'.repeat(middleLength);

    return `${firstPart} ${maskedMiddle} ${lastPart}`;
  }
}
