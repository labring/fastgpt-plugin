import { PluginTypeEnum, type PluginTypeType } from '@domain/entities/plugin-base.entity';
import {
  type PluginStreamAnswerType,
  type PluginStreamMessageType,
  PluginStreamResponseDataSchema
} from '@domain/value-objects/plugin-stream.vo';
import { StreamData } from '@domain/value-objects/stream.vo';
import { PluginChannelHostMethod } from '@infrastructure/plugin/plugin-runtime/ports/channel';
import type { PluginToolRunPayloadType } from '@infrastructure/plugin/tool.impl';
import { getErrText } from '@shared/utils/err';

import { InvokeClient } from './invoke.client';
import { PluginFactory } from './plugin-factory';
import type { DefinedToolFactory } from './tool-definition';

/** Node-only binding; the Worker entry never imports this module. */
class NodeToolRuntime extends PluginFactory {
  public getPluginType(): PluginTypeType {
    return PluginTypeEnum.tool;
  }

  constructor(tool: DefinedToolFactory) {
    super();
    if (this.mode)
      this.getChannel().setRequestHandler(async (msg) => {
        if (msg.method === PluginChannelHostMethod.request && msg.params.eventName === 'run') {
          try {
            const { input, systemVar, childId, secrets } = msg.params
              .payload as PluginToolRunPayloadType;
            // Keep the existing Node channel execution contract unchanged.
            const def = tool.getToolHandler(childId ?? 'tool');

            if (!def) {
              throw new Error('No tool registered');
            }

            const output = StreamData.create<PluginStreamMessageType>();

            void (async () => {
              try {
                const result = await def.handler(input, {
                  systemVar,
                  secrets,
                  invoke: new InvokeClient(this.getChannel(), {
                    invocationId: msg.traceId
                  }),
                  streamResponse: (msg: PluginStreamAnswerType) => {
                    output.send({
                      type: 'stream',
                      data: msg
                    });
                  }
                });

                // handler 返回值原样透传:content 等业务字段保持旧插件的任意 JSON 语义,
                // 结构化 content parts 由 outputSchema 声明约定,不在 wire 层强校验。
                output.send({
                  type: 'response',
                  data: PluginStreamResponseDataSchema.parse(result)
                });
              } catch (err) {
                output.send({
                  data: getErrText(err, 'Unknown error during tool execution'),
                  type: 'error'
                });
              } finally {
                output.end();
              }
            })();

            return this.getChannel().createReply(undefined, {
              output
            });
          } catch (err) {
            const output: StreamData<PluginStreamMessageType> = StreamData.create();
            output.write({
              data: getErrText(err, 'Unknown error during tool execution'),
              type: 'error'
            });
            output.end();
            return this.getChannel().createReply(undefined, {
              output
            });
          }
        }
        return;
      });
  }
}

export function bindNodeTool<T extends DefinedToolFactory>(tool: T): T {
  new NodeToolRuntime(tool);
  return tool;
}
