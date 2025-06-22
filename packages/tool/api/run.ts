import { z } from 'zod';
import { s } from '@/router/init';
import { contract } from '@/contract';
import { getTool } from '@tool/controller';
import { dispatchWithNewWorker } from '@/worker';
import { isProd } from '@/constants';
import { SystemVarSchema } from '@tool/type';
import { getErrText } from '@tool/utils/err';

export const runToolContract = {
  path: '/run',
  method: 'POST',
  description: 'Run a tool',
  body: z.object({
    toolId: z.string(),
    inputs: z.record(z.any()),
    systemVar: SystemVarSchema
  }),
  responses: {
    200: z.object({
      output: z.record(z.any())
    })
  }
} as const;

export const runToolHandler = () =>
  s.route(contract.tool.run, async (args) => {
    const { toolId, inputs, systemVar } = args.body;
    const tool = getTool(toolId);

    if (!tool) {
      return {
        status: 404,
        body: { error: 'tool not found' }
      };
    }

    try {
      const result = isProd
        ? await dispatchWithNewWorker({ toolId, inputs, systemVar })
        : await tool.cb(inputs, systemVar);

      if (result?.error) {
        return {
          status: 500,
          body: getErrText(result.error)
        };
      } else {
        return {
          status: 200,
          body: contract.tool.run.responses[200].parse(result)
        };
      }
    } catch (error) {
      return {
        status: 500,
        body: { error }
      };
    }
  });
