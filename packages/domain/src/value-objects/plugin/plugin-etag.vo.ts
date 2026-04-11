import type { FileObject } from '../file/file-object.vo';

export const getPluginEtag = ({ pkgFile }: { pkgFile: FileObject }): string => {
  return pkgFile.metaData.etag.slice(0, 8);
};
