import { s } from '@/router/init';
import { contract } from '@/contract';
import { getCachedData } from '@/cache';
import { SystemCacheKeyEnum } from '@/cache/type';
import { ToolDetailSchema } from '@tool/type/api';

export const getToolsHandler = s.route(contract.tool.list, async () => {
  // this list will only be called when syncKey is changed.
  const data = await getCachedData(SystemCacheKeyEnum.systemTool);
  const body = Array.from(data.values()).map((item) => {
    return ToolDetailSchema.parse(item);
  });
  return {
    status: 200,
    body
  };
});
