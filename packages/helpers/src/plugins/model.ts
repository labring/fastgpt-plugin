import { PluginFactory } from '../common/plugin-factory';
import type { ModelItemType } from '../models/schemas';

export interface ModelGenerateParams {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
}

export interface ModelGenerateResult {
  content: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason?: string;
}

export interface ModelEmbedParams {
  model: string;
  texts: string[];
}

export interface ModelEmbedResult {
  embeddings: number[][];
  usage?: { totalTokens: number };
}

export type GenerateHandler = (params: ModelGenerateParams) => Promise<ModelGenerateResult>;
export type EmbedHandler = (params: ModelEmbedParams) => Promise<ModelEmbedResult>;
export type ListModelsHandler = () => Promise<{ models: ModelItemType[] }>;

/**
 * Model 类型插件。
 *
 * @example
 * const plugin = new ModelPlugin();
 * plugin
 *   .registerGenerate(async ({ messages }) => ({ content: '...' }))
 *   .registerEmbed(async ({ texts }) => ({ embeddings: [[...]] }))
 *   .registerListModels(async () => ({ models: [...] }));
 * export { plugin };
 */
export class ModelPlugin extends PluginFactory {
  registerGenerate(handler: GenerateHandler): this {
    this.router.handle('generate', (params) => handler(params as ModelGenerateParams));
    return this;
  }

  registerEmbed(handler: EmbedHandler): this {
    this.router.handle('embed', (params) => handler(params as ModelEmbedParams));
    return this;
  }

  registerListModels(handler: ListModelsHandler): this {
    this.router.handle('listModels', () => handler());
    return this;
  }
}
