import type { FileMetadataType, FileUploadParamsType } from '../value-objects/s3-file.vo';
import type { StreamDataType } from '../value-objects/tool.vo';

/**
 * 反向调用
 */
export interface InvokePort {
  uploadFile(input: FileUploadParamsType): Promise<FileMetadataType>;
  /** 向客户端推送流式内容，入参为 StreamData（answer/fastAnswer + content），由 Host 包装成 SSE 信封发出 */
  streamResponse(input: StreamDataType): Promise<void>;
}
