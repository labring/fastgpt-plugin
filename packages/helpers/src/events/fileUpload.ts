import type { FileMetadata } from '../common/schemas/s3';
import { SubPub } from './class';
import { EventEnum, type FileInput } from './schemas';

/**
 * 文件上传事件发布器
 * 纯静态工具类，处理文件上传相关事件
 *
 * @example
 * // 注册监听器（带返回值）
 * FileUploadPub.register(async (data) => {
 *   const result = await uploadToS3(data);
 *   return result;  // 返回值会作为响应
 * });
 *
 * // 发布事件（无响应）
 * FileUploadPub.upload({ url: 'https://example.com/file.pdf' });
 *
 * // 发布事件（带响应）
 * const result = await FileUploadPub.uploadWithResponse({
 *   url: 'https://example.com/file.pdf'
 * });
 * console.log('上传结果:', result);
 */
export class FileUploadPub extends SubPub {
  /**
   * 注册文件上传事件监听器
   * @param fn 文件上传事件回调函数，可以返回值或 Promise
   */
  static register(fn: (data: FileInput, id?: string) => any | Promise<FileMetadata>): void {
    this.on(EventEnum.enum['file-upload'], fn);
  }

  /**
   * 移除文件上传事件监听器
   * @param fn 文件上传事件回调函数
   */
  static unregister(fn: (data: FileInput, id?: string) => any | Promise<any>): void {
    this.off(EventEnum.enum['file-upload'], fn);
  }

  /**
   * 发布文件上传事件（无响应）
   * @param data 文件上传数据
   */
  static upload(data: FileInput): void {
    this.send(EventEnum.enum['file-upload'], data);
  }

  /**
   * 发布文件上传事件并等待响应
   * @param data 文件上传数据
   * @param timeout 超时时间（毫秒），默认 30000ms
   * @returns Promise<上传结果>
   */
  static uploadWithResponse<T = any>(data: FileInput, timeout?: number): Promise<T> {
    return this.sendWithResponse<T>(EventEnum.enum['file-upload'], data, timeout);
  }
}
