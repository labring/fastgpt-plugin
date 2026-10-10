import { ToolRunInputDTOSchema } from '@interface-adapter/contracts/dto/tool.dto';
import { ToolContract } from '@interface-adapter/contracts/route/tool.contract';

import { PluginStreamMessageSchema } from '@domain/value-objects/plugin-stream.vo';

import { ClientTransport } from './transport';
import type {
  ClientRequestOptions,
  FastGPTPluginClientOptions,
  PluginStreamAnswerType,
  PluginStreamResponseDataType,
  RunToolStreamParams} from './types';

type ParsedPluginStreamMessage =
  | {
      type: 'response';
      data: PluginStreamResponseDataType;
    }
  | {
      type: 'stream';
      data: PluginStreamAnswerType;
    }
  | {
      type: 'error';
      data: string;
    };

export class RunToolWithStream {
  private readonly transport: ClientTransport;

  constructor(options: FastGPTPluginClientOptions) {
    this.transport = new ClientTransport(options);
  }

  async run(
    params: RunToolStreamParams,
    requestOptions?: ClientRequestOptions
  ): Promise<{
    output?: PluginStreamResponseDataType;
    error?: Error;
  }> {
    try {
      const payload = ToolRunInputDTOSchema.parse(params);

      const response = await this.transport.requestResponse({
        path: `/api${ToolContract.RunStream.meta.path}`,
        method: ToolContract.RunStream.meta.method,
        body: payload,
        headers: {
          Accept: 'text/event-stream'
        },
        signal: requestOptions?.signal
      });

      if (!response.body) {
        throw new Error('Tool stream response body is empty');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalResult: PluginStreamResponseDataType | undefined;
      let finalError: Error | undefined;

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });

        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';

        for (const chunk of chunks) {
          const message = this.parseStreamMessage(chunk);
          if (!message) continue;

          if (message.type === 'stream') {
            params.onMessage?.(message.data);
            continue;
          }

          if (message.type === 'response') {
            finalResult = message.data;
            await reader.cancel();
            break;
          }

          finalError = new Error(message.data);
          await reader.cancel();
          break;
        }

        if (done || finalResult || finalError) {
          break;
        }
      }

      if (!finalResult && !finalError) {
        const trailingMessage = this.parseStreamMessage(buffer);
        if (trailingMessage?.type === 'response') {
          finalResult = trailingMessage.data;
        } else if (trailingMessage?.type === 'error') {
          finalError = new Error(trailingMessage.data);
        } else if (trailingMessage?.type === 'stream') {
          params.onMessage?.(trailingMessage.data);
        }
      }

      if (finalError) {
        return { error: finalError };
      }

      if (finalResult) {
        return { output: finalResult };
      }

      throw new Error('Tool stream closed without terminal event');
    } catch (e) {
      return { error: e instanceof Error ? e : new Error(String(e)) };
    }
  }

  private parseStreamMessage(chunk: string): ParsedPluginStreamMessage | null {
    const normalized = chunk
      .split('\n')
      .map((line) => (line.startsWith('data:') ? line.slice(5).trimStart() : line))
      .join('\n')
      .trim();

    if (!normalized) {
      return null;
    }

    try {
      const parsed = JSON.parse(normalized);
      return PluginStreamMessageSchema.parse(parsed) as ParsedPluginStreamMessage;
    } catch {
      return null;
    }
  }
}
