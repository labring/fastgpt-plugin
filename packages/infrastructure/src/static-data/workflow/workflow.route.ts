import { createOpenAPIHono, R } from '@infrastructure/hono/utils/response';

import { listWorkflowsRoute } from './schemas/routes';
import { workflows } from './init';

const workflow = createOpenAPIHono();

/**
 * List workflow templates
 */
workflow.openapi(listWorkflowsRoute, async (c) => {
  if (workflows) {
    return R.success(c, workflows);
  } else {
    return R.error(c, 500, 'Templates init failed');
  }
});

export default workflow;
