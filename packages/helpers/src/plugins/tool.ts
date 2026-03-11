import { z } from 'zod';
import { PluginFactory } from '../common/plugin-factory';
import type { SystemVarType, ToolHandlerReturnType, ToolContextType } from '../tools/schemas/req';

export type ToolHandlerDefinition<TInput = unknown, TOutput = Record<string, unknown>> = {
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  handler: (input: TInput, ctx: ToolContextType) => Promise<TOutput>;
};

/**
 * 创建带有类型安全和自动错误处理的 tool handler。
 *
 * - 自动用 Zod schema 验证输入参数
 * - handler 只需返回 output 对象，自动包装成 { output }
 * - 自动捕获 handler 抛出的异常，转换为 { error } 返回值
 * - inputSchema / outputSchema 可通过 getConfig IPC 查询，也可在 parse time 静态读取
 *
 * @example
 * const InputSchema = z.object({ query: z.string() });
 * const OutputSchema = z.object({ result: z.string() });
 *
 * plugin.registerTool(
 *   createToolHandler(InputSchema, OutputSchema, async ({ query }) => {
 *     return { result: query };
 *   })
 * );
 *
 * // 工具集（多个子工具）
 * plugin.registerTool('search', createToolHandler(SearchInputSchema, SearchOutputSchema, searchHandler));
 * plugin.registerTool('index',  createToolHandler(IndexInputSchema,  IndexOutputSchema,  indexHandler));
 */
export function createToolHandler<TInput, TOutput extends Record<string, unknown>>(
  inputSchema: z.ZodType<TInput>,
  outputSchema: z.ZodType<TOutput>,
  handler: (input: TInput, ctx: ToolContextType) => Promise<TOutput>
): ToolHandlerDefinition<TInput, TOutput> {
  return { inputSchema, outputSchema, handler };
}

/**
 * Tool 类型插件。支持单个 tool 或工具集（多个具名子工具）。
 *
 * @example 单个 tool
 * const plugin = new ToolPlugin();
 * plugin.registerTool(createToolHandler(InputSchema, OutputSchema, handler));
 * export { plugin };
 *
 * @example 工具集
 * const plugin = new ToolPlugin();
 * plugin.registerTool('search', createToolHandler(SearchInputSchema, SearchOutputSchema, searchHandler));
 * plugin.registerTool('index',  createToolHandler(IndexInputSchema,  IndexOutputSchema,  indexHandler));
 * export { plugin };
 */
export class ToolPlugin extends PluginFactory {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly _tools = new Map<string, ToolHandlerDefinition<any, any>>();

  constructor() {
    super();

    this.router.handle('execute', async (params) => {
      const { toolName, inputs, systemVar } = params as {
        toolName?: string;
        inputs: Record<string, unknown>;
        systemVar: SystemVarType;
      };

      const def = this._resolveTool(toolName);

      const parsed = def.inputSchema.safeParse(inputs);
      if (!parsed.success) {
        return { error: parsed.error.message } satisfies ToolHandlerReturnType;
      }

      try {
        const output = await def.handler(parsed.data, { systemVar });
        return { output } satisfies ToolHandlerReturnType;
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : String(err)
        } satisfies ToolHandlerReturnType;
      }
    });
  }

  /** 注册单个 tool（无名）*/
  registerTool(definition: ToolHandlerDefinition<any, any>): this; // eslint-disable-line @typescript-eslint/no-explicit-any
  /** 注册具名 tool（工具集子工具）*/
  registerTool(name: string, definition: ToolHandlerDefinition<any, any>): this; // eslint-disable-line @typescript-eslint/no-explicit-any
  registerTool(
    nameOrDef: string | ToolHandlerDefinition<any, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
    definition?: ToolHandlerDefinition<any, any> // eslint-disable-line @typescript-eslint/no-explicit-any
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
   * 返回插件的静态配置，写入 config.json 并响应 getConfig IPC。
   *
   * 格式：
   *   单工具:  { inputSchema: {}, outputSchema: {} }
   *   工具集:  { tool1: { inputSchema: {}, outputSchema: {} }, tool2: { ... } }
   *
   * 每个 entry 可在未来扩展更多字段（如 description、examples 等）。
   */
  public override getConfig(): Record<string, unknown> {
    const toEntry = (def: ToolHandlerDefinition<any, any>) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      inputSchema: z.toJSONSchema(def.inputSchema),
      outputSchema: z.toJSONSchema(def.outputSchema)
    });

    if (this._tools.size === 1 && this._tools.has('')) {
      return toEntry(this._tools.get('')!);
    }

    const config: Record<string, unknown> = {};
    for (const [name, def] of this._tools) {
      config[name] = toEntry(def);
    }
    return config;
  }

  private _resolveTool(toolName?: string): ToolHandlerDefinition<any, any> { // eslint-disable-line @typescript-eslint/no-explicit-any
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
