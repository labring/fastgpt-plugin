import { z } from 'zod';
import { PluginFactory } from './plugin-factory';
import type {
  ToolContextType,
  ToolHandlerReturnType
} from '@fastgpt-plugin/domain/value-objects/tool.vo';
import type { SystemVarType } from '@fastgpt-plugin/domain/value-objects/system-var.vo';
import type { InvokePort } from '@fastgpt-plugin/domain/ports/invoke.port';
import type { FileMetadataType } from '@fastgpt-plugin/domain/value-objects/file.vo';

export type ToolHandlerDefinition<
  TInput = unknown,
  TOutput = Record<string, unknown>,
  TSecret = Record<string, unknown>
> = {
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  secretSchema?: z.ZodType<TSecret>;
  handler: (input: TInput, ctx: ToolContextType & { secrets: TSecret }) => Promise<TOutput>;
};

export function createToolHandler<
  TInput,
  TOutput extends Record<string, unknown>,
  TSecret extends Record<string, unknown> = Record<string, unknown>
>(
  def: ToolHandlerDefinition<TInput, TOutput, TSecret>
): ToolHandlerDefinition<TInput, TOutput, TSecret> {
  return def;
}

/**
 * Tool 类型插件。支持单个 tool 或工具集（多个具名子工具）。
 *
 * @example 单个 tool
 * const plugin = new ToolPlugin();
 * plugin.registerTool(createToolHandler({ inputSchema: InputSchema, outputSchema: OutputSchema, handler }));
 * export { plugin };
 *
 * @example 工具集（共享 secret）
 * const plugin = new ToolPlugin();
 * plugin.setSecret(SecretSchema);  // 所有子工具共用同一份 secret
 * plugin.registerTool('search', createToolHandler({ inputSchema: SearchInputSchema, outputSchema: SearchOutputSchema, handler: searchHandler }));
 * plugin.registerTool('index',  createToolHandler({ inputSchema: IndexInputSchema,  outputSchema: IndexOutputSchema,  handler: indexHandler }));
 * export { plugin };
 */
export class ToolPlugin extends PluginFactory {
  private readonly _tools = new Map<string, ToolHandlerDefinition<any, any, any>>();
  private _secretSchema?: z.ZodType<any>;

  constructor() {
    super();

    this.router.handle('execute', async (params) => {
      const { toolName, inputs, systemVar, callbackToken, secrets } = params as {
        toolName?: string;
        inputs: Record<string, unknown>;
        systemVar: SystemVarType;
        callbackToken?: string;
        secrets?: Record<string, unknown>;
      };

      // 保存当前执行上下文的 token，供 callHost() 使用
      this._callbackToken = callbackToken;

      const invoke: InvokePort = {
        uploadFile: (args) => this.callHost('uploadFile', args) as Promise<FileMetadataType>,
        streamResponse: (args) => this.callHost('streamResponse', args) as Promise<void>
      };

      const def = this._resolveTool(toolName);

      const parsed = def.inputSchema.safeParse(inputs);
      if (!parsed.success) {
        return { error: parsed.error.message } satisfies ToolHandlerReturnType;
      }

      // 验证 secrets：工具集用父层 _secretSchema，单工具用 def.secretSchema
      const secretSchema = this._secretSchema ?? def.secretSchema;
      let validatedSecrets: Record<string, unknown> = {};
      if (secretSchema) {
        const parsedSecrets = secretSchema.safeParse(secrets ?? {});
        if (!parsedSecrets.success) {
          return {
            error: `Secret validation failed: ${parsedSecrets.error.message}`
          } satisfies ToolHandlerReturnType;
        }
        validatedSecrets = parsedSecrets.data as Record<string, unknown>;
      }

      try {
        const output = await def.handler(parsed.data, {
          systemVar,
          invoke,
          secrets: validatedSecrets
        });
        return { output } satisfies ToolHandlerReturnType;
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : String(err)
        } satisfies ToolHandlerReturnType;
      } finally {
        this._callbackToken = undefined;
      }
    });
  }

  /** 注册单个 tool（无名）*/
  registerTool(
    definition: ToolHandlerDefinition<any, any, any>
  ): this; /** 注册具名 tool（工具集子工具）*/
  registerTool(name: string, definition: ToolHandlerDefinition<any, any, any>): this;
  registerTool(
    nameOrDef: string | ToolHandlerDefinition<any, any, any>,
    definition?: ToolHandlerDefinition<any, any, any>
  ): this {
    if (typeof nameOrDef === 'string') {
      this._tools.set(nameOrDef, definition!);
    } else {
      // 单个 tool 用空串作 key
      this._tools.set('', nameOrDef);
    }
    return this;
  }

  /**
   * 设置工具集级别的共享 secretSchema。
   * 仅在工具集模式（多个具名子工具）下有效；单工具请在 createToolHandler 的 secretSchema 字段中定义。
   */
  setSecret<T extends Record<string, unknown>>(schema: z.ZodType<T>): this {
    this._secretSchema = schema;
    return this;
  }

  /**
   * 返回插件的静态配置，写入 config.json 并响应 getConfig IPC。
   *
   * 格式：
   *   单工具:  { inputSchema: {}, outputSchema: {}, secretSchema?: {} }
   *   工具集:  { secretSchema?: {}, tool1: { inputSchema: {}, outputSchema: {} }, tool2: { ... } }
   */
  public override getConfig(): Record<string, unknown> {
    const toEntry = (def: ToolHandlerDefinition<any, any, any>) => {
      const entry: Record<string, unknown> = {
        inputSchema: z.toJSONSchema(def.inputSchema),
        outputSchema: z.toJSONSchema(def.outputSchema)
      };
      if (def.secretSchema) {
        entry.secretSchema = z.toJSONSchema(def.secretSchema);
      }
      return entry;
    };

    if (this._tools.size === 1 && this._tools.has('')) {
      return toEntry(this._tools.get('')!);
    }

    const config: Record<string, unknown> = {};
    if (this._secretSchema) {
      config.secretSchema = z.toJSONSchema(this._secretSchema);
    }
    for (const [name, def] of this._tools) {
      config[name] = toEntry(def);
    }
    return config;
  }

  private _resolveTool(toolName?: string): ToolHandlerDefinition<any, any, any> {
    if (toolName !== undefined) {
      const def = this._tools.get(toolName);
      if (!def) throw new Error(`Tool not found: ${toolName}`);
      return def;
    }
    // 未指定 toolName：要求恰好注册了一个 tool（单工具模式）
    if (this._tools.size === 1) {
      const def = [...this._tools.values()][0];
      if (!def) throw new Error('No tool registered');
      return def;
    }
    throw new Error('toolName is required for toolsets');
  }
}
