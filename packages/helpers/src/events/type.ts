import type { StreamMessageType } from 'dist/tools/schemas/req';
import type { Cherrio2MdInput, Cherrio2MdResult, FileInput } from './schemas';
import type { FileMetadata } from 'dist/common/schemas/s3';

export interface EventEmitter {
  uploadFile(input: FileInput): Promise<FileMetadata>;
  streamResponse(input: StreamMessageType): void;
  html2md(html: string): Promise<string>;
  cherrio2md(input: Cherrio2MdInput): Promise<Cherrio2MdResult>;
}
