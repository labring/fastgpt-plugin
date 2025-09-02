import { s } from '@/router/init';
import { getToolHandler } from './api/getTool';
import { getToolsHandler } from './api/list';
import { getTypeHandler } from './api/getType';
import { getTemplateHandler } from './api/getTemplateList';
import { contract } from '@/contract';

export const toolRouter = s.router(contract.tool, {
  getTool: getToolHandler,
  list: getToolsHandler,
  getType: getTypeHandler,
  getTemplateList: getTemplateHandler
});
