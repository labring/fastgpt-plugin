import { ToolRunInputDTOSchema } from '@interface-adapter/contracts/dto/tool.dto';
import { ToolContract } from '@interface-adapter/contracts/route/tool.contract';

import { ToolStreamMessageSchema } from '@domain/value-objects/tool.vo';

import { ClientTransport } from './transport';
import type {
  ClientRequestOptions,
  FastGPTPluginClientOptions,
  RunToolStreamParams,
  ToolAnswerType,
  ToolHandlerReturnType
} from './types';

type ParsedToolStreamMessage =
  | {
      type: 'response';
      data: ToolHandlerReturnType;
    }
  | {
      type: 'stream';
      data: ToolAnswerType;
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
    output?: ToolHandlerReturnType;
    error?: Error;
  }> {
    const payload = ToolRunInputDTOSchema.parse({
      pluginId: params.pluginId,
      version: params.version,
      source: params.source,
      systemVar: params.systemVar,
      input: params.input
    });

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
    let finalResult: ToolHandlerReturnType | undefined;
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
  }

  private parseStreamMessage(chunk: string): ParsedToolStreamMessage | null {
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
      return ToolStreamMessageSchema.parse(parsed) as ParsedToolStreamMessage;
    } catch {
      return null;
    }
  }
}
