import { s } from '@/router/init';
import { contract } from '@/contract';
import { pluginFileS3Server } from '@/s3';
import { getNanoid } from '@tool/utils/string';

export default s.route(contract.tool.upload.install, async ({ body }) => {
  await pluginFileS3Server.uploadFileAdvanced({
    url: body.url,
    defaultFilename: '/system/plugin/' + getNanoid()
  });
  return {
    status: 200,
    body: {
      message: 'ok'
    }
  };
});
