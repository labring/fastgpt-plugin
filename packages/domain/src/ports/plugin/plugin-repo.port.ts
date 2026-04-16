import type { PluginTagType, PluginType, PluginTypeType } from '../../entities/plugin.entity';
import type { FileObject } from '../../value-objects/file/file-object.vo';
import type { PkgContentFileObjects } from '../../value-objects/file/pkg-file.vo';
import type {
  PluginTagListType,
  PluginUniqueIdType,
  UserPluginIdType
} from '../../value-objects/plugin.vo';
import type { Result } from '../../value-objects/result.vo';

/** 操作 Plugin S3, Mongo，本地缓存, 代码里面的静态配置 ...*/
export interface PluginRepoPort {
  /** 获取 pending 的 plugin id */
  getPendingPluginIds(): Promise<Result<PluginUniqueIdType[]>>;
  /** 创建插件 */
  createPlugin(arg: {
    plugin: PluginType;
    pending?: boolean;
    files: PkgContentFileObjects;
  }): Promise<Result>;

  /** 移除某个插件的 pending 状态 */
  confirmPlugin(uniqueId: PluginUniqueIdType): Promise<Result<PluginType>>;

  /** 获取某个插件信息 */
  getPluginById(
    uniqueId: PluginUniqueIdType
  ): Promise<Result<{ info: PluginType; indexFile: FileObject; entryFilePath: string }>>;

  getPluginsByPluginId(pluginId: string): Promise<Result<PluginType[]>>;
  getPluginByUserPluginId(userPluginId: UserPluginIdType): Promise<Result<PluginType>>;

  /** 列出所有插件 */
  list(arg: {
    types?: PluginTypeType[];
    tags?: PluginTagType[];
    op?: 'or' | 'and';
  }): Promise<Result<PluginType[]>>;
  listActive(): Promise<Result<PluginType[]>>;
  pruneDisabled(): Promise<Result<{ count: number; plugins: PluginUniqueIdType[] }>>;

  listTags(): Promise<Result<PluginTagListType>>;

  // File-Store
  // Remote
  getPluginFileAccessURL(
    uniqueId: PluginUniqueIdType,
    filePath: string[],
    pending: boolean
  ): Promise<Result<string>>;
}
