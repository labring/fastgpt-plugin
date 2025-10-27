import { s } from '@/router/init';
import { contract } from '@/contract';
import { MongoS3TTL } from '@/s3/ttl/schema';
import { UploadToolsS3Path } from '@tool/constants';
import { MongoPlugin } from '@/mongo/models/plugins';

export default s.route(contract.tool.upload.confirmUpload, async ({ body }) => {
  const { toolIds } = body;

  await MongoPlugin.create(
    toolIds.map((toolId) => ({
      toolId,
      type: 'tool'
    }))
  );

  await MongoS3TTL.deleteMany({
    minioKey: {
      $regex: toolIds.map((toolId) => `^${UploadToolsS3Path}/${toolId}`).join('|')
    }
  });

  return {
    status: 200,
    body: {
      message: 'ok'
    }
  };
});
