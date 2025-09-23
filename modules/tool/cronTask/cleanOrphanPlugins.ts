import { MongoPluginModel, pluginTypeEnum } from '@/mongo/models/plugins';
import { lockEnum, withLock } from '@/redis/lock';
import { pluginFileS3Server } from '@/s3';
import { addLog } from '@/utils/log';
import { UploadToolsS3Path } from '@tool/constants';
export default async () => {
  try {
    await withLock(lockEnum.Enum.cleanOrphanPlugin, 60000, async () => {
      const tools = await MongoPluginModel.find({
        type: pluginTypeEnum.Enum.tool
      }).lean();

      const objectNames = tools.map((tool) => tool.objectName);
      const files = await pluginFileS3Server.getFiles(UploadToolsS3Path);
      const orphans = files.filter((file) => !objectNames.includes(file));
      await pluginFileS3Server.removeFiles(orphans);
    });
  } catch {
    addLog.info('Acquire Lock failed, other task is running');
  }
};
