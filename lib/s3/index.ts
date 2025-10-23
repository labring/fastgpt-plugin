import { S3Service } from './controller';

export const fileUploadS3Server = (() => {
  if (!global._fileUploadS3Server) {
    global._fileUploadS3Server = new S3Service({
      maxFileSize: process.env.MAX_FILE_SIZE
        ? parseInt(process.env.MAX_FILE_SIZE)
        : 20 * 1024 * 1024, // 默认 20MB
      bucket: process.env.S3_PUBLIC_BUCKET || 'fastgpt-public',
      externalBaseURL: process.env.S3_EXTERNAL_BASE_URL,
      isPublicRead: true
    });
    global._fileUploadS3Server.initialize('public');
  }
  return global._fileUploadS3Server;
})();

export const pluginFileS3Server = (() => {
  if (!global._pluginFileS3Server) {
    global._pluginFileS3Server = new S3Service({
      maxFileSize: 50 * 1024 * 1024, // 默认 50MB
      bucket: process.env.S3_PRIVATE_BUCKET || 'fastgpt-private',
      externalBaseURL: process.env.S3_EXTERNAL_BASE_URL,
      isPublicRead: false
    });
    global._pluginFileS3Server.initialize('private');
  }
  return global._pluginFileS3Server;
})();

declare global {
  var _fileUploadS3Server: S3Service;
  var _pluginFileS3Server: S3Service;
}
