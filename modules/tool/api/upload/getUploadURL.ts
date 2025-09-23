import { s } from '@/router/init';
import { contract } from '@/contract';
import { pluginFileS3Server } from '@/s3';
import { UploadToolsS3Path } from '@tool/constants';
import { mimeMap } from '@/s3/const';

export default s.route(contract.tool.upload.getUploadURL, async ({ query: { filename } }) => {
  return {
    status: 200,
    body: await pluginFileS3Server.generateUploadPresignedURL({
      filepath: UploadToolsS3Path,
      contentType: mimeMap['.js'],
      filename
    })
  };
});
