import { s } from '@/router/init';
import { contract } from '@/contract';
import { getTool } from '@tool/controller';
import { dispatchWithNewWorker } from '@/worker';
import { getErrText } from '@tool/utils/err';
import { addLog } from '@/utils/log';

export const runToolHandler = s.route(contract.tool.run, async (args) => {
  const { toolId, inputs, systemVar } = args.body;
  addLog.debug('Run tool', { toolId, inputs, systemVar });
  const tool = getTool(toolId);

  if (!tool) {
    addLog.error('Tool not found', { toolId });
    return {
      status: 404,
      body: { error: 'tool not found' }
    };
  }

  try {
    const result = await dispatchWithNewWorker({ toolId, inputs, systemVar });

    if (result?.error) {
      addLog.error(`Run tool ${toolId} error`, result.error);
      return {
        status: 500,
        body: {
          error: getErrText(result.error) || 'unknown error'
        }
      };
    } else {
      addLog.debug('Run tool success', { toolId });
      return {
        status: 200,
        body: contract.tool.run.responses[200].parse(result)
      };
    }
  } catch (error) {
    addLog.error(`Run tool ${toolId} error`, error);
    return {
      status: 500,
      body: { error: getErrText(error) }
    };
  }
});
