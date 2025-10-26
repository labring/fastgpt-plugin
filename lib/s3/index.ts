import { S3Service } from './controller';

export const publicS3Server = (() => {
  if (!global._publicS3Server) {
    global._publicS3Server = new S3Service({
      maxFileSize: process.env.MAX_FILE_SIZE
        ? parseInt(process.env.MAX_FILE_SIZE)
        : 20 * 1024 * 1024, // 默认 20MB
      bucket: process.env.S3_PUBLIC_BUCKET || 'fastgpt-public',
      externalBaseURL: process.env.S3_EXTERNAL_BASE_URL,
      isPublicRead: true
    });
    global._publicS3Server.initialize('public');
  }
  return global._publicS3Server;
})();

export const privateS3Server = (() => {
  if (!global._privateS3Server) {
    global._privateS3Server = new S3Service({
      maxFileSize: 50 * 1024 * 1024, // 默认 50MB
      bucket: process.env.S3_PRIVATE_BUCKET || 'fastgpt-private',
      externalBaseURL: process.env.S3_EXTERNAL_BASE_URL,
      isPublicRead: false
    });
    global._privateS3Server.initialize('private');
  }
  return global._privateS3Server;
})();

declare global {
  var _publicS3Server: S3Service;
  var _privateS3Server: S3Service;
}
