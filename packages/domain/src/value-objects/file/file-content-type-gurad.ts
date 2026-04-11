import { FileObject } from './file-object.vo';
import type { MIMEType } from './MIME.vo';

export const FileContentTypeGurad = <C extends MIMEType>(
  file: FileObject,
  contentType: C
): file is FileObject => {
  if (Array.isArray(contentType)) {
    return contentType.includes(file.metaData.contentType);
  }
  return file.metaData.contentType === contentType;
};
