import { s } from '@/router/init';
import { contract } from '@/contract';
import { privateS3Server } from '@/s3';
import { UploadToolsS3Path } from '@tool/constants';
import { mimeMap } from '@/s3/const';

export default s.route(contract.tool.upload.getUploadURL, async ({ query: { filename } }) => {
  const body = await privateS3Server.generateUploadPresignedURL({
    filepath: UploadToolsS3Path,
    contentType: mimeMap['.pkg'],
    maxSize: 100 * 1024 * 1024, // 100MB
    filename,
    fileExpireMins: 60
  });
  return {
    status: 200,
    body
  };
});
