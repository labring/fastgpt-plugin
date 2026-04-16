import Stream from 'stream';

import {
  InvokeMethodEnum,
  type InvokePort,
  type InvokeUploadFileInputType,
  type InvokeUploadFileOutputType
} from '@domain/ports/invoke.port';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import type { PluginIpcChannel } from '@infrastructure/plugin/plugin-runtime/drivers/local-pool/ipc-channel';

/**
 * 实现反向调用的 Client 侧方法
 */
export class InvokeClient implements InvokePort {
  constructor(private channel: PluginIpcChannel) {}
  async uploadFile(input: InvokeUploadFileInputType): Promise<Result<InvokeUploadFileOutputType>> {
    try {
      const response = await this.channel.requestDuplex(
        InvokeMethodEnum.uploadFile,
        {
          contentType: input.contentType,
          fileName: input.fileName
        },
        {
          input: Buffer.isBuffer(input.file)
            ? Stream.Readable.from(input.file)
            : (input.file as Stream.Readable)
        }
      );

      return successResult(response.result as InvokeUploadFileOutputType);
    } catch (err) {
      return failureResult(
        {
          en: 'Failed to upload file',
          'zh-CN': '上传文件失败'
        },
        err
      );
    }
  }
}
