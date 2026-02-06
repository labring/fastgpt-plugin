import { SubPub } from './class';
import { EventEnum } from './schemas';

/**
 * HTML 转 Markdown 事件发布器
 * 纯静态工具类，处理 HTML 转 Markdown 相关事件
 *
 * @example
 * // 注册监听器
 * Html2MdPub.register((data) => {
 *   const markdown = convertToMarkdown(data.html);
 *   return markdown;  // 返回值会作为响应
 * });
 *
 * // 发布事件（无响应）
 * Html2MdPub.publish({ html: '<p>Hello</p>' });
 *
 * // 发布事件（带响应）
 * const markdown = await Html2MdPub.publishWithResponse({ html: '<p>Hello</p>' });
 */
export class Html2MdPub extends SubPub {
  /**
   * 注册 HTML 转 Markdown 事件监听器
   * @param fn HTML 转换事件回调函数
   */
  static register(fn: (data: { html: string }, id?: string) => any | Promise<string>): void {
    this.on(EventEnum.enum['html2md'], fn);
  }

  /**
   * 移除 HTML 转 Markdown 事件监听器
   * @param fn HTML 转换事件回调函数
   */
  static unregister(fn: (data: any, id?: string) => any | Promise<any>): void {
    this.off(EventEnum.enum['html2md'], fn);
  }

  /**
   * 发布 HTML 转 Markdown 事件
   * @param data HTML 转换数据
   */
  static async convert(data: { html: string }): Promise<string> {
    return this.sendWithResponse(EventEnum.enum['html2md'], data);
  }
}
