import type {
  DatasetSourceConfig,
  DatasetSourceId,
  FileItem,
  FileContentResponse
} from '../type/source';

// 数据源回调接口
export type DatasetSourceCallbacks = {
  listFiles: (params: { config: Record<string, any>; parentId?: string }) => Promise<FileItem[]>;

  getFileContent: (params: {
    config: Record<string, any>;
    fileId: string;
  }) => Promise<FileContentResponse>;

  getFilePreviewUrl: (params: { config: Record<string, any>; fileId: string }) => Promise<string>;

  getFileDetail: (params: { config: Record<string, any>; fileId: string }) => Promise<FileItem>;
};

// 完整数据源定义
export type DatasetSourceDefinition = DatasetSourceConfig & {
  callbacks: DatasetSourceCallbacks;
};

// 注册表类
class SourceRegistry {
  private sources = new Map<DatasetSourceId, DatasetSourceDefinition>();

  register(source: DatasetSourceDefinition) {
    this.sources.set(source.sourceId, source);
  }

  get(sourceId: DatasetSourceId): DatasetSourceDefinition | undefined {
    return this.sources.get(sourceId);
  }

  list(): DatasetSourceConfig[] {
    return Array.from(this.sources.values()).map(({ callbacks, ...config }) => config);
  }

  getCallbacks(sourceId: DatasetSourceId): DatasetSourceCallbacks | undefined {
    return this.sources.get(sourceId)?.callbacks;
  }

  has(sourceId: DatasetSourceId): boolean {
    return this.sources.has(sourceId);
  }

  clear() {
    this.sources.clear();
  }
}

// 单例导出
export const sourceRegistry = new SourceRegistry();

// 辅助函数：定义数据源
export const defineSource = (
  config: DatasetSourceConfig,
  callbacks: DatasetSourceCallbacks
): DatasetSourceDefinition => ({
  ...config,
  callbacks
});
