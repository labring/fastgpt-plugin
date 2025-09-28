import { MongoPluginModel, pluginTypeEnum } from '@/mongo/models/plugins';
import { lockEnum, withLock } from '@/redis/lock';
import { pluginFileS3Server } from '@/s3';
import { addLog } from '@/utils/log';
import { UploadToolsS3Path } from '@tool/constants';

// Remove invalid s3 files
export default async () => {
  try {
    await withLock(lockEnum.Enum.cleanOrphanPlugin, 60000, async () => {
      const tools = await MongoPluginModel.find({
        type: pluginTypeEnum.Enum.tool
      }).lean();

      const objectNames = tools.reduce((acc, tool) => acc.add(tool.objectName), new Set<string>());
      const files = await pluginFileS3Server.getFiles(UploadToolsS3Path);

      const orphans = files.filter((file) => !objectNames.has(file));
      await pluginFileS3Server.removeFiles(orphans);
    });
  } catch {
    addLog.info('Acquire Lock failed, other task is running');
  }
};
