import { type PluginType, type PluginTypeType } from '../entities/plugin.entity';
import type { PluginUniqueIdType } from '../value-objects/plugin.vo';

export type SpecifiedPluginType<T extends object> = PluginType & { meta: T };

export interface PluginPort<T extends PluginType> {
  create(plugin: T): Promise<void>;
  update(uniqueId: PluginUniqueIdType, plugin: Partial<T>): Promise<void>;

  deleteByPluginId(pluginId: string): Promise<void>;
  deleteByUniqueId(uniqueId: PluginUniqueIdType): Promise<void>;

  search(query: Partial<PluginUniqueIdType> & { pluginId: string }): Promise<T[] | undefined>;
  listAll(): Promise<T[]>;
  getByType(type: PluginTypeType): Promise<T[]>;
}
