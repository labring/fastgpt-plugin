import { InvokeManager } from '@infrastructure/plugin/invoke/invoke.impl';
import { FC_REQUEST_PROTOCOL } from '@infrastructure/plugin/plugin-runtime/drivers/serverless/FC/const';
import type { FCInvokeFrame } from '@infrastructure/plugin/plugin-runtime/drivers/serverless/FC/types';
import type { PluginToolRunPayloadType } from '@infrastructure/plugin/tool.impl';
import { getErrText } from '@shared/utils/err';

import type { FCRuntimeEnv } from './env';
import type { LoadedPluginFactory } from './plugin-loader';

export type FCRuntimeInvokeRequest = {
  protocol: typeof FC_REQUEST_PROTOCOL;
  invocationId: string;
  eventName: 'run';
  returnStream: boolean;
  payload: PluginToolRunPayloadType;
};

export async function executePluginRequest({
  env,
  factory,
  request,
  writeFrame
}: {
  env: FCRuntimeEnv;
  factory: LoadedPluginFactory;
  request: FCRuntimeInvokeRequest;
  writeFrame: (frame: FCInvokeFrame) => void;
}): Promise<void> {
  if (request.protocol !== FC_REQUEST_PROTOCOL) {
    throw new Error('Unsupported FC runtime protocol');
  }
  if (request.eventName !== 'run') {
    throw new Error(`Unsupported event: ${request.eventName}`);
  }

  const { childId, input, secrets, systemVar } = request.payload;
  const def = factory.getToolHandler(childId ?? 'tool');
  if (!def) {
    throw new Error('No tool registered');
  }

  try {
    const result = await def.handler(input, {
      systemVar,
      secrets,
      invoke: new InvokeManager({
        token: typeof systemVar.invokeToken === 'string' ? systemVar.invokeToken : '',
        fastgptBaseUrl: env.FASTGPT_BASE_URL
      }),
      streamResponse: (msg: any) => {
        writeFrame({
          type: 'stream',
          data: msg
        });
      }
    });

    writeFrame({
      type: 'response',
      data: result
    });
  } catch (error) {
    writeFrame({
      type: 'error',
      data: {
        code: 'FC_HANDLER_ERROR',
        invocationId: request.invocationId,
        message: getErrText(error, 'Unknown error during tool execution')
      }
    });
  }
}
