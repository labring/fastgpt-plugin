import { s } from '@/router/init';
import { contract } from '@/contract';
import { formatToolList } from '@tool/utils/tool';
import { getCachedData } from '@/cache';
import { SystemCacheKeyEnum } from '@/cache/type';

export const getToolsHandler = s.route(contract.tool.list, async () => {
  // this list will only be called when syncKey is changed.
  const data = await getCachedData(SystemCacheKeyEnum.systemTool);
  return {
    status: 200,
    body: formatToolList(data)
  };
});
