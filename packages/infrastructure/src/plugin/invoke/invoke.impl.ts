import {
  type InvokePort,
  type InvokeUploadFileInputType,
  InvokeUploadFileOutputSchema,
  type InvokeUploadFileOutputType
} from '@domain/ports/invoke.port';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';

export type InvokeUploadFileHandler = (arg: {
  token: string;
  input: InvokeUploadFileInputType;
}) => Promise<Result<InvokeUploadFileOutputType>>;

export type InvokeManagerDeps = {
  token: string;
  uploadFileHandler: InvokeUploadFileHandler;
};

export class InvokeManager implements InvokePort {
  constructor(private readonly deps: InvokeManagerDeps) {}

  async uploadFile(input: InvokeUploadFileInputType): Promise<Result<InvokeUploadFileOutputType>> {
    const [result, err] = await this.deps.uploadFileHandler({
      token: this.deps.token,
      input
    });
    if (err) return failureResult(err);

    try {
      return successResult(InvokeUploadFileOutputSchema.parse(result));
    } catch (error) {
      return failureResult(
        {
          en: 'Invalid invoke upload file output',
          'zh-CN': '反向调用上传文件返回数据格式错误'
        },
        error
      );
    }
  }
}
