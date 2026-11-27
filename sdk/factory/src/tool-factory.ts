import z from 'zod';

import { PluginTypeEnum, type PluginTypeType } from '@domain/entities/plugin-base.entity';
import type { InvokePort } from '@domain/ports/invoke.port';
import type { PluginStreamAnswerType } from '@domain/value-objects/plugin-stream.vo';
import type { SystemVarType } from '@domain/value-objects/system-var.vo';

import type { UserToolManifestType } from './manifest.type';
export type ToolContextType<TSecret = Record<string, unknown>> = {
  systemVar: SystemVarType;
  secrets: TSecret;
};

export type ToolChildManifestDefinition = {
  id: string;
  description: UserToolManifestType['description'];
  name: UserToolManifestType['name'];
  icon?: string;
  toolDescription?: unknown;
};

type ToolInputSchema = z.ZodObject<any>;
type ToolOutputSchema = z.ZodObject<any>;
type ToolSecretSchema = z.ZodTypeAny | undefined;

type ToolSecretValue<TSecret extends ToolSecretSchema> = TSecret extends z.ZodTypeAny
  ? z.output<NoInfer<TSecret>>
  : undefined;

export type ToolHandlerContext<TSecret extends ToolSecretSchema> = {
  systemVar: SystemVarType;
  secrets?: ToolSecretValue<TSecret>;
  invoke: InvokePort;
  streamResponse: (msg: PluginStreamAnswerType) => void;
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
  toolDescription?: unknown;
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

export class ToolFactory {
  private toolHandlers: Map<string, ToolHandlerDefinition<any, any, any>> = new Map();
  private childManifests: Map<string, ToolChildManifestDefinition> = new Map();
  private secretSchema: z.ZodType<any> = z.record(z.string(), z.unknown());
  private userToolManifest: UserToolManifestType;

  private constructor(userToolManifest: UserToolManifestType) {
    this.userToolManifest = userToolManifest;
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

  static getInstance(userToolManifest: UserToolManifestType): ToolFactory {
    return new ToolFactory(userToolManifest);
  }

  public getPluginType(): PluginTypeType {
    return PluginTypeEnum.tool;
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
