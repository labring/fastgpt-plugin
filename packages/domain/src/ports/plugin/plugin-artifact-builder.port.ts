import type { FileObject } from '../../value-objects/file/file-object.vo';
import type { Result } from '../../value-objects/result.vo';

/** Selected by server assembly; absent for runtimes using the original index.js. */
export interface PluginArtifactBuilderPort {
  build(index: FileObject): Promise<Result<Buffer>>;
}
