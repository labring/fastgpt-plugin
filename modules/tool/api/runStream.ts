import type { Request, Response, NextFunction } from 'express';
import { getTool } from '@tool/controller';
import { dispatchWithNewWorker } from '@/worker';
import { StreamManager } from '../utils/stream';
import { StreamMessageTypeEnum, StreamDataAnswerTypeEnum } from '../type/stream';
import { addLog } from '@/utils/log';
import { getErrText } from '@tool/utils/err';

export const runToolStreamHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const { toolId, inputs, systemVar } = req.body;

  addLog.debug('Run tool stream', { toolId, inputs, systemVar });

  const tool = getTool(toolId);

  if (!tool) {
    addLog.error('Tool not found', { toolId });
    res.status(404).json({ error: 'tool not found' });
    return;
  }
  const streamManager = new StreamManager(res);
  try {
    await dispatchWithNewWorker({
      toolId,
      inputs,
      systemVar,
      onMessage: (message) => {
        // forwarding to Stream
        switch (message.type) {
          case StreamMessageTypeEnum.DATA: {
            // there is no "type", the content is directly output.
            streamManager.sendMessage({
              type: StreamMessageTypeEnum.DATA,
              data: message.data
            });
            break;
          }
          case StreamMessageTypeEnum.ERROR:
            streamManager.sendMessage({
              type: StreamMessageTypeEnum.ERROR,
              error: message.error
            });
            break;
        }
      }
    });

    streamManager.close();
  } catch (error) {
    addLog.error(`Run tool ${toolId} stream error`, error);
    streamManager.sendMessage({
      type: StreamMessageTypeEnum.ERROR,
      error: getErrText(error)
    });
  }
};
