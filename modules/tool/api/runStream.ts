import type { Request, Response, NextFunction } from 'express';
import { getTool } from '@tool/controller';
import { dispatchWithNewWorker } from '@/worker';
import { SSEManager } from '../utils/sse';
import { SSEMessageType, StreamDataAnswerType } from '../type/stream';
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
  const sseManager = new SSEManager(res);
  try {
    await dispatchWithNewWorker({
      toolId,
      inputs,
      systemVar,
      onMessage: (message) => {
        // forwarding to SSE
        switch (message.type) {
          case SSEMessageType.DATA:
            sseManager.sendMessage(message.data);
            break;
          case SSEMessageType.ERROR:
            sseManager.sendMessage({
              type: StreamDataAnswerType.Error,
              content: message.data
            });
            break;
        }
      }
    });

    sseManager.close();
  } catch (error) {
    addLog.error(`Run tool ${toolId} stream error`, error);
    sseManager.sendMessage({
      type: StreamDataAnswerType.Error,
      content: getErrText(error)
    });
  }
};
