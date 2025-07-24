import { s } from '@/router/init';
import { getToolHandler } from './api/getTool';
import { getToolsHandler } from './api/list';
import { deleteToolHandler } from './api/delete';
import { uploadToolHandler } from './api/upload';
import { contract } from '@/contract';

export const toolRouter = s.router(contract.tool, {
  getTool: getToolHandler,
  list: getToolsHandler,
  delete: deleteToolHandler,
  upload: uploadToolHandler
});
