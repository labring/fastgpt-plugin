import { PluginFactory } from '../common/plugin-factory';

export interface DatasetSearchParams {
  query: string;
  limit?: number;
  similarity?: number;
  datasetId: string;
}

export interface DatasetSearchResult {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface DatasetIndexParams {
  datasetId: string;
  docs: Array<{ id?: string; content: string; metadata?: Record<string, unknown> }>;
}

export interface DatasetDeleteParams {
  datasetId: string;
  ids: string[];
}

export type SearchHandler = (params: DatasetSearchParams) => Promise<DatasetSearchResult[]>;
export type IndexHandler = (params: DatasetIndexParams) => Promise<{ indexed: number }>;
export type DeleteHandler = (params: DatasetDeleteParams) => Promise<{ deleted: number }>;

/**
 * Dataset（知识库）类型插件。
 *
 * @example
 * const plugin = new DatasetPlugin();
 * plugin
 *   .registerSearch(async ({ query }) => [...])
 *   .registerIndex(async ({ docs }) => ({ indexed: docs.length }))
 *   .registerDelete(async ({ ids }) => ({ deleted: ids.length }));
 * export { plugin };
 */
export class DatasetPlugin extends PluginFactory {
  registerSearch(handler: SearchHandler): this {
    this.router.handle('search', (params) => handler(params as DatasetSearchParams));
    return this;
  }

  registerIndex(handler: IndexHandler): this {
    this.router.handle('index', (params) => handler(params as DatasetIndexParams));
    return this;
  }

  registerDelete(handler: DeleteHandler): this {
    this.router.handle('delete', (params) => handler(params as DatasetDeleteParams));
    return this;
  }
}
