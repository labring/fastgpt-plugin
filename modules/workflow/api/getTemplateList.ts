import { s } from '@/router/init';
import { contract } from '@/contract';
import { workflows } from '../init';

export const getTemplateList = s.route(contract.workflow.getTemplateList, async () => {
  if (workflows)
    return {
      status: 200,
      body: workflows
    };
  else
    return {
      status: 500,
      body: {
        error: 'Templates init failed'
      }
    };
});
