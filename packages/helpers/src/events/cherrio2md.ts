import { SubPub } from './class';
import { EventEnum, type Cherrio2MdInput, type Cherrio2MdResult } from './schemas';

/**
 * Cheerio 转 Markdown 事件发布器
 * 纯静态工具类，处理 Cheerio HTML 转 Markdown 相关事件
 *
 * @example
 * // 注册监听器（带返回值）
 * Cherrio2MdPub.register(async (data) => {
 *   const result = await convertToMarkdown(data);
 *   return result;  // 返回值会作为响应
 * });
 *
 * // 发布事件（无响应）
 * Cherrio2MdPub.convert({
 *   fetchUrl: 'https://example.com',
 *   html: '<html>...</html>',
 *   selector: 'body'
 * });
 *
 * // 发布事件（带响应）
 * const result = await Cherrio2MdPub.convertWithResponse({
 *   fetchUrl: 'https://example.com',
 *   html: '<html>...</html>',
 *   selector: 'body'
 * });
 * console.log('转换结果:', result.markdown);
 */
export class Cherrio2MdPub extends SubPub {
  /**
   * 注册 Cheerio 转 Markdown 事件监听器
   * @param fn Cheerio 转换事件回调函数，可以返回值或 Promise
   */
  static register(
    fn: (data: Cherrio2MdInput, id?: string) => any | Promise<Cherrio2MdResult>
  ): void {
    this.on(EventEnum.enum['cherrio2md'], fn);
  }

  /**
   * 移除 Cheerio 转 Markdown 事件监听器
   * @param fn Cheerio 转换事件回调函数
   */
  static unregister(fn: (data: Cherrio2MdInput, id?: string) => any | Promise<any>): void {
    this.off(EventEnum.enum['cherrio2md'], fn);
  }

  /**
   * 发布 Cheerio 转 Markdown 事件并等待响应
   * @param data Cheerio 转换数据
   * @param timeout 超时时间（毫秒），默认 30000ms
   * @returns Promise<转换结果>
   */
  static convertWithResponse(data: Cherrio2MdInput, timeout?: number): Promise<Cherrio2MdResult> {
    return this.sendWithResponse<Cherrio2MdResult>(EventEnum.enum['cherrio2md'], data, timeout);
  }
}
