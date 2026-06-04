import { WorkflowContract } from '@interface-adapter/contracts/route/workflow.contract';

import { createRoute } from '@infrastructure/hono/utils/response';
import { createOpenAPIHono, R } from '@infrastructure/hono/utils/response';
import { workflows } from '@infrastructure/static-data/workflow/init';

export const makeWorkflowRoute = () => {
  const route = createOpenAPIHono();

  route.openapi(
    createRoute({
      ...WorkflowContract.List.meta,
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: WorkflowContract.List.response[200]
            }
          }
        },
        500: {
          description: 'HTTP 500 response',
          content: {
            'application/json': {
              schema: WorkflowContract.List.response[500]
            }
          }
        }
      }
    }),
    async (c) => R.success(c, workflows)
  );

  return route;
};
