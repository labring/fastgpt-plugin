import { randomUUID } from 'node:crypto';

import Stream from 'stream';

import {
  InvokeMethodEnum,
  type InvokePort,
  type InvokeUploadFileInputType,
  InvokeUploadFileOutputSchema,
  type InvokeUploadFileOutputType
} from '@domain/ports/invoke.port';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import {
  HOST_INVOKE_METHOD,
  type PluginIpcChannel
} from '@infrastructure/plugin/plugin-runtime/drivers/local-pool/ipc-channel';

/**
 * 实现反向调用的 Client 侧方法
 */
export class InvokeClient implements InvokePort {
  constructor(
    private channel: PluginIpcChannel,
    private readonly options: { invocationId?: string } = {}
  ) {}

  async uploadFile(input: InvokeUploadFileInputType): Promise<Result<InvokeUploadFileOutputType>> {
    try {
      const response = await this.channel.requestDuplex(
        HOST_INVOKE_METHOD,
        {
          method: InvokeMethodEnum.uploadFile,
          args: {
            contentType: input.contentType,
            fileName: input.fileName
          }
        },
        {
          requestId: randomUUID(),
          traceId: this.options.invocationId,
          input: Buffer.isBuffer(input.file)
            ? Stream.Readable.from(input.file)
            : (input.file as Stream.Readable)
        }
      );

      return successResult(InvokeUploadFileOutputSchema.parse(response.result));
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
