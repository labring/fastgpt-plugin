import { s } from '@/router/init';
import { contract } from '@/contract';

export default s.route(contract.tool.upload.install, async ({ body }) => {
  const buffer = await (await fetch(body.url)).arrayBuffer();
  // save the buffer to a file in tmpDir
  // await privateS3Server.uploadFileAdvanced({
  //   url: body.url,
  //   defaultFilename: '/system/plugin/' + getNanoid()
  // });
  return {
    status: 200,
    body: {
      message: 'ok'
    }
  };
});
