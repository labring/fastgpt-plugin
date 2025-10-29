import { s } from '@/router/init';
import { contract } from '@/contract';
import { MongoS3TTL } from '@/s3/ttl/schema';
import { UploadToolsS3Path } from '@tool/constants';
import { MongoPlugin, pluginTypeEnum, PluginZodSchema } from '@/mongo/models/plugins';
import { refreshVersionKey } from '@/cache';
import { SystemCacheKeyEnum } from '@/cache/type';
import { mongoSessionRun } from '@/mongo/utils';

export default s.route(contract.tool.upload.confirmUpload, async ({ body }) => {
  const { toolIds } = body;

  const tools = await MongoPlugin.find({
    toolId: {
      $in: toolIds
    },
    type: pluginTypeEnum.Enum.tool
  });

  if (tools.length !== toolIds.length) {
    return {
      status: 400,
      body: {
        message: 'Some toolIds are invalid'
      }
    };
  }

  await mongoSessionRun(async (session) => {
    await MongoPlugin.updateMany(
      {
        toolId: {
          $in: toolIds
        }
      },
      {
        $set: {
          status: PluginZodSchema.shape.status.Enum.active
        },
        $unset: {
          ttl: 1
        }
      },
      {
        session
      }
    );
    await MongoS3TTL.deleteMany(
      {
        minioKey: {
          $regex: toolIds.map((toolId) => `^${UploadToolsS3Path}/${toolId}`).join('|')
        }
      },
      {
        session
      }
    );
  });

  await refreshVersionKey(SystemCacheKeyEnum.systemTool);

  return {
    status: 200,
    body: {
      message: 'ok'
    }
  };
});
