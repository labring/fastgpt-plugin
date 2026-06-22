import { WorkflowContract } from '@interface-adapter/contracts/route/workflow.contract';

import type { RemoteFileStoragePort } from '@domain/ports/file-storage/remote-file-storage.port';
import { createRoute } from '@infrastructure/hono/utils/response';
import { createOpenAPIHono, R } from '@infrastructure/hono/utils/response';
import {
  attachWorkflowAvatarUrls,
  workflows
} from '@infrastructure/static-data/workflow/init';

export type WorkflowRouteDeps = {
  publicRemoteFileStorageRepo: Pick<RemoteFileStoragePort, 'getAccessUrl'>;
};

export const makeWorkflowRoute = (deps: WorkflowRouteDeps) => {
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
    async (c) => {
      const workflowTemplates = await attachWorkflowAvatarUrls(
        workflows,
        deps.publicRemoteFileStorageRepo
      );

      return R.success(c, workflowTemplates);
    }
  );

  return route;
};
