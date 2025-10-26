import { s } from '@/router/init';
import { contract } from '@/contract';
import { parseUploadedTool } from '@tool/utils';

export default s.route(contract.tool.upload.parseUploadedTool, async ({ query }) => {
  const { objectName } = query;

  const res = await parseUploadedTool(objectName);
  return {
    status: 200,
    body: res
  };
});
