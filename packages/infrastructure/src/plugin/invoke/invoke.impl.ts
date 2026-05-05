import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { buffer as readStreamToBuffer } from 'node:stream/consumers';

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
  fastgptBaseUrl: string;
};

export class InvokeManager implements InvokePort {
  constructor(private readonly deps: InvokeManagerDeps) {}

  async uploadFile(input: InvokeUploadFileInputType): Promise<Result<InvokeUploadFileOutputType>> {
    let formData: FormData;
    try {
      formData = await this.buildFormData(input);
    } catch (error) {
      return failureResult(
        {
          en: 'Invoke upload file failed',
          'zh-CN': '反向调用上传文件失败'
        },
        error
      );
    }

    let response: Response;
    try {
      response = await fetch(this.buildUrl('/api/invoke/fileUpload'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.deps.token}`
        },
        body: formData
      });
    } catch (error) {
      return failureResult(
        {
          en: 'Invoke upload file failed',
          'zh-CN': '反向调用上传文件失败'
        },
        error
      );
    }

    if (!response.ok) {
      return failureResult(
        {
          en: 'Invoke upload file failed',
          'zh-CN': '反向调用上传文件失败'
        },
        await this.readErrorResponse(response)
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      return failureResult(
        {
          en: 'Invalid invoke upload file output',
          'zh-CN': '反向调用上传文件返回数据格式错误'
        },
        error
      );
    }

    const [result, responseErr] = this.parseResponse(payload);
    if (responseErr) return failureResult(responseErr);

    try {
      return successResult(InvokeUploadFileOutputSchema.parse(this.normalizeOutput(result)));
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

  private buildUrl(path: string): string {
    return new URL(path, this.deps.fastgptBaseUrl).toString();
  }

  private async buildFormData(input: InvokeUploadFileInputType): Promise<FormData> {
    const formData = new FormData();
    const fileBuffer = await this.toBuffer(input.file);
    const fileName = input.fileName ?? randomUUID();
    const contentType = input.contentType ?? 'application/octet-stream';
    const blobPart = new Uint8Array(fileBuffer.byteLength);

    blobPart.set(fileBuffer);
    formData.append('file', new Blob([blobPart], { type: contentType }), fileName);
    if (input.fileName) formData.append('fileName', input.fileName);
    if (input.contentType) formData.append('contentType', input.contentType);

    return formData;
  }

  private async toBuffer(file: InvokeUploadFileInputType['file']): Promise<Buffer> {
    if (Buffer.isBuffer(file)) return file;
    if (file instanceof Readable) return readStreamToBuffer(file);
    return Buffer.from(file);
  }

  private parseResponse(payload: unknown): Result<unknown> {
    if (!this.isRecord(payload)) return successResult(payload);

    if (payload.success === false) {
      return failureResult(
        {
          en: this.getResponseMessage(payload) ?? 'Invoke upload file failed',
          'zh-CN': this.getResponseMessage(payload) ?? '反向调用上传文件失败'
        },
        payload
      );
    }

    if (typeof payload.code === 'number' && payload.code >= 400) {
      return failureResult(
        {
          en: this.getResponseMessage(payload) ?? 'Invoke upload file failed',
          'zh-CN': this.getResponseMessage(payload) ?? '反向调用上传文件失败'
        },
        payload
      );
    }

    return successResult('data' in payload ? payload.data : payload);
  }

  private normalizeOutput(payload: unknown): unknown {
    if (!this.isRecord(payload)) return payload;

    const output = { ...payload };
    const createTime = output.createTime;
    if (typeof createTime === 'string' || typeof createTime === 'number') {
      output.createTime = new Date(createTime);
    }
    if (output.accessURL === undefined && typeof output.accessUrl === 'string') {
      output.accessURL = output.accessUrl;
    }

    return output;
  }

  private async readErrorResponse(response: Response) {
    return {
      status: response.status,
      statusText: response.statusText,
      body: (await response.text().catch(() => '')).slice(0, 1000)
    };
  }

  private getResponseMessage(payload: Record<string, unknown>): string | undefined {
    return typeof payload.message === 'string' ? payload.message : undefined;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
  }
}
