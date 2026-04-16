import type { PluginTypeType } from '@domain/entities/plugin-base.entity';

export type FactoryCreateOptions = {
  /** 创建的插件的类型 */
  type: PluginTypeType;
};
