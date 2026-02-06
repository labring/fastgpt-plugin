import type { FileMetadata } from '../common/schemas/s3';
import type { StreamMessageType } from '../tools/schemas/req';
import type { Cherrio2MdInput, Cherrio2MdResult, FileInput } from './schemas';

export interface EventEmitter {
  uploadFile(input: FileInput): Promise<FileMetadata>;
  streamResponse(input: StreamMessageType): void;
  html2md(html: string): Promise<string>;
  cherrio2md(input: Cherrio2MdInput): Promise<Cherrio2MdResult>;
}
