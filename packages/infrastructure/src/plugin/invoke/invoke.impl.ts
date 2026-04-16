import type { RemoteFileStoragePort } from '@domain/ports/file-storage/remote-file-storage.port';
import {
  type InvokePort,
  type InvokeUploadFileInputType,
  InvokeUploadFileOutputSchema,
  type InvokeUploadFileOutputType
} from '@domain/ports/invoke.port';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';

export type InvokeManagerDeps = {
  publicRemoteFileStorageRepo: RemoteFileStoragePort;
};

export class InvokeManager implements InvokePort {
  constructor(private readonly deps: InvokeManagerDeps) {}

  async uploadFile(input: InvokeUploadFileInputType): Promise<Result<InvokeUploadFileOutputType>> {
    const [file, err] = await this.deps.publicRemoteFileStorageRepo.save({
      file: input.file,
      contentType: input.contentType
    });
    if (err) return failureResult(err);

    const [accessURL, accErr] = await this.deps.publicRemoteFileStorageRepo.getAccessUrl(
      file.metaData.fileKey
    );
    if (accErr) return failureResult(accErr);

    return successResult(
      InvokeUploadFileOutputSchema.parse({
        ...file.metaData,
        accessURL: accessURL
      })
    );
  }
}
