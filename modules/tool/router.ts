import { s } from '@/router/init';
import { getToolHandler } from './api/getTool';
import { getToolsHandler } from './api/list';
import { runToolHandler } from './api/run';
import { contract } from '@/contract';

export const toolRouter = s.router(contract.tool, {
  getTool: getToolHandler,
  list: getToolsHandler,
  run: runToolHandler
});
