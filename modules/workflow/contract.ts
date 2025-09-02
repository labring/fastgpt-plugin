import { c } from '@/contract/init';
import { TemplateListSchema } from './type';

export const workflowContract = c.router(
  {
    getTemplateList: {
      path: '/list',
      method: 'GET',
      description: 'Get template list',
      responses: {
        200: TemplateListSchema
      }
    }
  },
  {
    pathPrefix: '/workflow'
  }
);
