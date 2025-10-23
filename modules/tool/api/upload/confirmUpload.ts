import { s } from '@/router/init';
import { contract } from '@/contract';
import { confirmUpload } from '@tool/utils';

export default s.route(contract.tool.upload.confirmUpload, async ({ body }) => {
  const { objectName } = body;
  await confirmUpload(objectName);

  return {
    status: 200,
    body: {
      message: 'ok'
    }
  };
});
