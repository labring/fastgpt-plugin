import type { Request, Response, NextFunction } from 'express';
import { getTool } from '@tool/controller';
import { dispatchWithNewWorker } from '@/worker';
import { SSEManager } from '../utils/sse';
import { addLog } from '@/utils/log';
import { getErrText } from '@tool/utils/err';

export const runToolStreamHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { toolId, inputs, systemVar } = req.body;

  addLog.debug('Run tool stream', { toolId, inputs, systemVar });

  const tool = getTool(toolId);

  if (!tool) {
    addLog.error('Tool not found', { toolId });
    res.status(404).json({ error: 'tool not found' });
    return;
  }

  try {
    const sseManager = new SSEManager(res);

    await dispatchWithNewWorker({
      toolId,
      inputs,
      systemVar,
      onMessage: (message) => {
        // forwarding to SSE
        switch (message.type) {
          case 'data':
            sseManager.sendData(message.data, toolId);
            break;
          case 'success':
            sseManager.sendSuccess(message.data, toolId);
            break;
          case 'error':
            sseManager.sendError(message.data, toolId);
            break;
        }
      }
    });
  } catch (error) {
    addLog.error(`Run tool ${toolId} stream error`, error);
    const sseManager = new SSEManager(res);
    sseManager.sendError({ error: getErrText(error) }, toolId);
  }
};
