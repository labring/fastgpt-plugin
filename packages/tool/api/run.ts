import { s } from '@/router/init';
import { contract } from '@/contract';
import { getTool } from '@tool/controller';
import { dispatchWithNewWorker } from '@/worker';
import { isProd } from '@/constants';
import { getErrText } from '@tool/utils/err';

export const runToolHandler = s.route(contract.tool.run, async (args) => {
  const { toolId, inputs, systemVar } = args.body;
  const tool = getTool(toolId);

  if (!tool) {
    return {
      status: 404,
      body: { error: 'tool not found' }
    };
  }

  try {
    // const result = isProd
    //   ? await dispatchWithNewWorker({ toolId, inputs, systemVar })
    //   : await tool.cb(inputs, systemVar);
    const result = await dispatchWithNewWorker({ toolId, inputs, systemVar });

    if (result?.error) {
      return {
        status: 500,
        body: {
          error: getErrText(result.error) || 'unknown error'
        }
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
      body: { error: getErrText(error) }
    };
  }
});
