import { createRoute, z } from '@hono/zod-openapi';

import { createOpenAPIHono, R } from '@infrastructure/hono/utils/response';
import { workflows } from '@infrastructure/static-data/workflow/init';

export const makeWorkflowRoute = () => {
  const route = createOpenAPIHono();

  route.openapi(
    createRoute({
      method: 'get',
      path: '/list',
      tags: ['Workflows'],
      summary: 'List workflow templates',
      description: 'Get a list of all available workflow templates',
      responses: {
        200: {
          description: 'List of workflow templates',
          content: {
            'application/json': {
              schema: z.object({
                data: z.array(z.unknown())
              })
            }
          }
        }
      }
    }),
    async (c) => R.success(c, workflows)
  );

  return route;
};
