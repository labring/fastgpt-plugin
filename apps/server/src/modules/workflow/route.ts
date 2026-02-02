import { workflows } from '@workflow/init';
import { R, createOpenAPIHono } from '@/utils/http';
import { listWorkflowsRoute } from './schemas/routes';

const workflow = createOpenAPIHono();

/**
 * List workflow templates
 */
workflow.openapi(listWorkflowsRoute, async (c) => {
  if (workflows) {
    return c.json(R.success(workflows), 200);
  } else {
    return c.json(R.error(500, 'Templates init failed'), 500);
  }
});

export default workflow;
