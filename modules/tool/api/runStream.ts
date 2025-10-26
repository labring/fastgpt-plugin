import type { Request, Response, NextFunction } from 'express';
import { getTool } from '@tool/controller';
import { dispatchWithNewWorker } from 'lib/worker';
import { StreamManager } from '../utils/stream';
import { addLog } from '@/utils/log';
import { getErrText } from '@tool/utils/err';
import { recordToolExecution } from '@/utils/signoz';
import { StreamMessageTypeEnum, type RunToolSecondParamsType } from '@tool/type/req';

export const runToolStreamHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const { toolId, inputs, systemVar } = req.body;

  const tool = await getTool(toolId);

  if (!tool) {
    addLog.error('Tool not found', { toolId });

    recordToolExecution(toolId, 'error');
    res.status(404).json({ error: 'tool not found' });
    return;
  }
  const streamManager = new StreamManager(res);
  try {
    const result = await (async () => {
      const streamResponse: RunToolSecondParamsType['streamResponse'] = (e) =>
        streamManager.sendMessage({
          type: StreamMessageTypeEnum.stream,
          data: e
        });

      if (tool.isWorkerRun === false) {
        addLog.debug(`Run tool start`, { toolId, inputs, systemVar });
        return tool
          .cb(inputs, {
            systemVar,
            streamResponse
          })
          .then((res) => {
            if (res.error) {
              return Promise.reject(res.error);
            }
            return res;
          });
      }

      addLog.debug(`Run tool start in worker`, { toolId, inputs, systemVar });

      return dispatchWithNewWorker({
        toolId,
        inputs,
        systemVar,
        onMessage: streamResponse
      });
    })();

    streamManager.sendMessage({
      type: StreamMessageTypeEnum.response,
      data: result
    });

    if (result.error) {
      addLog.debug(`Run tool '${toolId}' failed`, { error: result.error });
    } else {
      addLog.debug(`Run tool '${toolId}' success`);
    }

    recordToolExecution(toolId, 'success');
  } catch (error) {
    addLog.error(`Run tool '${toolId}' error`, error);
    streamManager.sendMessage({
      type: StreamMessageTypeEnum.error,
      data: getErrText(error)
    });

    recordToolExecution(toolId, 'error');
  }
  streamManager.close();
};
