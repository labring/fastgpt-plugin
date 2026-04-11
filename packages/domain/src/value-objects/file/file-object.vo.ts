import type { Readable } from 'node:stream';

import type { Result } from '../result.vo';

import type { FileMetaType } from './file.vo';

export class FileObject {
  constructor(
    private properties: {
      metaData: FileMetaType;
      getReadStream: () => Promise<Result<Readable>>;
      getBuffer: () => Promise<Result<Buffer>>;
    }
  ) {}

  get metaData() {
    return this.properties.metaData;
  }

  get fileStream() {
    return this.properties.getReadStream();
  }

  get fileBuffer() {
    return this.properties.getBuffer();
  }
}
