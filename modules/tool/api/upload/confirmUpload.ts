import { s } from '@/router/init';
import { contract } from '@/contract';
import { MongoS3TTL } from '@/s3/ttl/schema';
import { UploadToolsS3Path } from '@tool/constants';

export default s.route(contract.tool.upload.confirmUpload, async ({ body }) => {
  const { toolId } = body;

  await MongoS3TTL.deleteMany({
    minioKey: {
      $regex: new RegExp(`${UploadToolsS3Path}/${toolId}`)
    }
  });

  return {
    status: 200,
    body: {
      message: 'ok'
    }
  };
});
