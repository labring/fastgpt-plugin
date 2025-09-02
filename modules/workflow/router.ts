import { s } from '@/router/init';
import { contract } from '@/contract';
import { getTemplateList } from './api/getTemplateList';

export const workflowRouter = s.router(contract.workflow, {
  getTemplateList
});
