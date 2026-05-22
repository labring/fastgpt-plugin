import Stream from 'stream';

import {
  InvokeMethodEnum,
  type InvokePort,
  type InvokeUploadFileInputType,
  InvokeUploadFileOutputSchema,
  type InvokeUploadFileOutputType,
  type InvokeUserInfoOutputType
} from '@domain/ports/invoke.port';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { PluginChannelClientMethod } from '@infrastructure/plugin/plugin-runtime/ports/channel';

import type { PluginRuntimeChannel } from './runtime-channel.type';

/**
 * 实现反向调用的 Client 侧方法
 */
export class InvokeClient implements InvokePort {
  constructor(
    private channel: PluginRuntimeChannel,
    private readonly options: { invocationId?: string } = {}
  ) {}

  async userInfo(): Promise<Result<InvokeUserInfoOutputType>> {
    try {
      const response = await this.channel.request(
        PluginChannelClientMethod.request,
        {
          method: InvokeMethodEnum.userInfo,
          args: {}
        },
        {
          traceId: this.options.invocationId
        }
      );

      const [result, responseErr] = response.result as [InvokeUserInfoOutputType, unknown];
      if (responseErr)
        return failureResult({
          en: 'Failed to get user info',
          'zh-CN': '获取用户信息失败'
        });
      return successResult(result);
    } catch (error) {
      return failureResult({ en: 'Failed to get user info', 'zh-CN': '获取用户信息失败' }, error);
    }
  }

  async uploadFile(input: InvokeUploadFileInputType): Promise<Result<InvokeUploadFileOutputType>> {
    try {
      const response = await this.channel.request(
        PluginChannelClientMethod.request,
        {
          method: InvokeMethodEnum.uploadFile,
          args: {
            contentType: input.contentType,
            fileName: input.fileName
          }
        },
        {
          traceId: this.options.invocationId,
          input: this.toUploadInputStream(input.file)
        }
      );

      const [result, err] = response.result as [InvokeUploadFileOutputType, unknown];
      if (err)
        return failureResult({
          en: 'Failed to upload file',
          'zh-CN': '上传文件失败'
        });

      return successResult(InvokeUploadFileOutputSchema.parse(result));
    } catch {
      return failureResult({
        en: 'Failed to upload file',
        'zh-CN': '上传文件失败'
      });
    }
  }

  private toUploadInputStream(file: InvokeUploadFileInputType['file']): Stream.Readable {
    if (file instanceof Stream.Readable) return file;
    return Stream.Readable.from(Buffer.from(file));
  }
}
