import type { Request, Response, NextFunction } from 'express';
import { getTool } from '@tool/controller';
import { dispatchWithNewWorker } from '@/worker';
import { StreamManager } from '../utils/stream';
import { StreamMessageTypeEnum } from '../type/tool';
import { addLog } from '@/utils/log';
import { getErrText } from '@tool/utils/err';
import { recordToolExecution } from '@/utils/signoz';

export const runToolStreamHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const { toolId, inputs, systemVar } = req.body;

  const tool = getTool(toolId);

  if (!tool) {
    addLog.error('Tool not found', { toolId });

    recordToolExecution(toolId, 'error');
    res.status(404).json({ error: 'tool not found' });
    return;
  }
  const streamManager = new StreamManager(res);
  try {
    addLog.debug(`Run tool start`, { toolId, inputs, systemVar });

    const result = await dispatchWithNewWorker({
      toolId,
      inputs,
      systemVar,
      onMessage: (e) =>
        streamManager.sendMessage({
          type: StreamMessageTypeEnum.stream,
          data: e
        })
    });

    streamManager.sendMessage({
      type: StreamMessageTypeEnum.response,
      data: result
    });
    addLog.debug(`Run tool '${toolId}' success`);

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
