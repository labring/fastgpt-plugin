import { s } from '@/router/init';
import { contract } from '@/contract';
import { parseUploadedTool } from '@tool/utils';
import { addLog } from '@/utils/log';
// import { lockEnum, withLock } from '@/redis/lock';

export default s.route(contract.tool.upload.parseUploadedTool, async ({ query }) => {
  const { objectName } = query;
  addLog.debug(`Parsing uploaded tool: ${objectName}`);
  const res = await parseUploadedTool(objectName);
  // const res = await withLock(lockEnum.enum.parsePkg, 20000, () => parseUploadedTool(objectName));

  addLog.debug(`Parsed tool: ${res.map((item) => item.toolId)}`);
  return {
    status: 200,
    body: res
  };
});
