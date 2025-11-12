export const mimeMap: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.zip': 'application/zip',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.doc': 'application/msword',
  '.xls': 'application/vnd.ms-excel',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.js': 'application/javascript',
  '.md': 'text/markdown'
};

export const PublicBucketBaseURL = process.env.S3_EXTERNAL_BASE_URL
  ? `${process.env.S3_EXTERNAL_BASE_URL}/${process.env.S3_PUBLIC_BUCKET}`
  : `${process.env.S3_USE_SSL ? 'https' : 'http'}://${process.env.S3_ENDPOINT}/${process.env.S3_PUBLIC_BUCKET}`;
