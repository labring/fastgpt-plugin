import type { PluginUniqueIdType } from '../value-objects/plugin.vo';
import type { Result } from '../value-objects/result.vo';

/**
 * 获取插件
 */
export interface PluginLoaderPort {
  getPluginFile(id: PluginUniqueIdType): Promise<Result<string>>;
}
