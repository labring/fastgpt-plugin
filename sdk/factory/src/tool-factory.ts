import z from 'zod';

import type { InvokePort } from '@domain/ports/invoke.port';
import { StreamData } from '@domain/value-objects/stream.vo';
import type { SystemVarType } from '@domain/value-objects/system-var.vo';
import type { ToolAnswerType, ToolStreamMessageType } from '@domain/value-objects/tool.vo';
import type { PluginToolRunPayloadType } from '@infrastructure/plugin/tool.impl';
import { getErrText } from '@shared/utils/err';

import type { UserToolManifestType } from './manifest.type';
import { PluginFactory } from './plugin-factory';
export type ToolContextType<TSecret = Record<string, unknown>> = {
  systemVar: SystemVarType;
  secrets: TSecret;
};

export type ToolChildManifestDefinition = {
  id: string;
  description: UserToolManifestType['description'];
  name: UserToolManifestType['name'];
  icon?: string;
  toolDescription?: string;
};

type ToolInputSchema = z.ZodObject<any>;
type ToolOutputSchema = z.ZodObject<any>;
type ToolSecretSchema = z.ZodTypeAny | undefined;

type ToolSecretValue<TSecret extends ToolSecretSchema> = TSecret extends z.ZodTypeAny
  ? z.output<NoInfer<TSecret>>
  : undefined;

type ToolHandlerContext<TSecret extends ToolSecretSchema> = {
  systemVar: SystemVarType;
  secrets?: ToolSecretValue<TSecret>;
  invoke: InvokePort;
  streamResponse: (msg: ToolAnswerType) => void;
};

type ToolHandlerFn<
  TInput extends ToolInputSchema,
  TOutput extends ToolOutputSchema,
  TSecret extends ToolSecretSchema
> = (
  input: z.output<NoInfer<TInput>>,
  ctx: ToolHandlerContext<TSecret>
) => Promise<z.output<NoInfer<TOutput>>>;

export type ToolHandlerDefinition<
  TInput extends ToolInputSchema = ToolInputSchema,
  TOutput extends ToolOutputSchema = ToolOutputSchema,
  TSecret extends ToolSecretSchema = undefined
> = {
  inputSchema: TInput;
  outputSchema: TOutput;
  secretSchema?: TSecret;
  handler: ToolHandlerFn<TInput, TOutput, TSecret>;
};

export function createToolHandler<
  TInput extends ToolInputSchema,
  TOutput extends ToolOutputSchema,
  TSecret extends ToolSecretSchema = undefined
>(
  def: ToolHandlerDefinition<TInput, TOutput, TSecret>
): ToolHandlerDefinition<TInput, TOutput, TSecret> {
  return def;
}

export class ToolFactory extends PluginFactory {
  private toolHandlers: Map<string, ToolHandlerDefinition<any, any, any>> = new Map();
  private childManifests: Map<string, ToolChildManifestDefinition> = new Map();
  private secretSchema: z.ZodType<any> = z.record(z.string(), z.unknown());

  private constructor(private userToolManifest: UserToolManifestType) {
    super();

    if (this.mode)
      this.getChannel().setRequestHandler(async (msg) => {
        if (msg.method === 'run') {
          try {
            const { input, systemVar, childId, secrets } = msg.params as PluginToolRunPayloadType;
            // 处理工具执行请求
            const def = this.toolHandlers.get(childId ?? 'toolI');

            if (!def) {
              throw new Error('No tool registered');
            }

            const streamResponse = StreamData.create<ToolAnswerType>();
            const output = StreamData.create<ToolStreamMessageType>();

            streamResponse.onData((msg) => {
              output.send({
                type: 'stream',
                data: msg
              });
            });

            const result = await def.handler(input, {
              systemVar,
              secrets,
              invoke: this.getInvoke(),
              streamResponse: (msg: ToolAnswerType) => {
                streamResponse.send(msg);
              }
            });

            output.send({
              type: 'reponse',
              data: result
            });

            return this.getChannel().replyDuplex(msg, undefined, {
              output
            });
          } catch (err) {
            const output: StreamData<ToolStreamMessageType> = StreamData.create();
            output.write({
              data: getErrText(err),
              type: 'error'
            });
            return this.getChannel().replyDuplex(msg, undefined, {
              output
            });
          }
        }
        return;
      });
  }

  public setSecretSchema<TSecret extends Record<string, unknown>>(
    schema: z.ZodType<TSecret>
  ): void {
    this.secretSchema = schema;
  }

  public registerTool(
    definition: ToolHandlerDefinition,
    id: string = 'tool',
    childManifest?: ToolChildManifestDefinition
  ): void {
    this.toolHandlers.set(id, definition);
    if (childManifest) {
      this.childManifests.set(id, childManifest);
    }
  }

  private static instance: ToolFactory;

  static getInstance(userToolManifest: UserToolManifestType): ToolFactory {
    if (!ToolFactory.instance) {
      ToolFactory.instance = new ToolFactory(userToolManifest);
    }
    return ToolFactory.instance;
  }

  public getSecretSchema() {
    return this.secretSchema;
  }
  /** 获取单独的工具 */
  public getToolHandler(): ToolHandlerDefinition;
  /** 获取子工具信息 */
  public getToolHandler(childId: string = 'tool'): ToolHandlerDefinition | undefined {
    return this.toolHandlers.get(childId);
  }
  public getUserToolManifest(): UserToolManifestType {
    return this.userToolManifest;
  }

  public getChildManifests(): ToolChildManifestDefinition[] {
    return [...this.childManifests.values()];
  }
}
