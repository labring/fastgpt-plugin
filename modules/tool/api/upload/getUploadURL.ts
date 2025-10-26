import { s } from '@/router/init';
import { contract } from '@/contract';
import { privateS3Server } from '@/s3';
import { UploadToolsS3Path } from '@tool/constants';
import { mimeMap } from '@/s3/const';
import { MongoS3TTL } from '@/s3/ttl/schema';

export default s.route(contract.tool.upload.getUploadURL, async ({ query: { filename } }) => {
  const body = await privateS3Server.generateUploadPresignedURL({
    filepath: UploadToolsS3Path,
    contentType: mimeMap['.pkg'],
    filename
  });
  await MongoS3TTL.create({
    bucketName: privateS3Server.getBucketName(),
    expiredTime: Date.now() + 3600000, // 1 hour,
    minioKey: body.objectName
  });
  return {
    status: 200,
    body
  };
});
