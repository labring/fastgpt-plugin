import type { PluginType } from '../../entities/plugin.entity';
import type { FileObject } from '../../value-objects/file/file-object.vo';
import type { PkgContentFileObjects } from '../../value-objects/file/pkg-file.vo';
import type { Result } from '../../value-objects/result.vo';

export interface PluginPKGFilePort {
  parsePluginPkg(
    pkgFile: FileObject,
    pending: boolean
  ): Promise<
    Result<{
      files: PkgContentFileObjects;
      info: PluginType;
    }>
  >;
}
