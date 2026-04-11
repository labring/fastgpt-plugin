// import {
//   type PluginBaseType,
//   type PluginTagType,
//   type PluginType,
//   type PluginTypeType
// } from '../../entities/plugin.entity';
// import type { FileObject } from '../../value-objects/file/file-object.vo';
// import type { I18nStringType } from '../../value-objects/i18n-string.vo';
// import type { PluginTagListType, PluginUniqueIdType } from '../../value-objects/plugin.vo';
// import type { Result } from '../../value-objects/result.vo';

// export interface PluginManagerPort<T extends PluginBaseType = PluginBaseType, C = unknown> {
//   /** 保存插件文件到远程(不载入) */
//   upload(pkgFile: FileObject): Promise<Result<PluginType>>;
//   /** 确认插件安装 */
//   confirm(id: PluginUniqueIdType): Promise<Result>;
//   /** 直接安装插件 (无需确认）*/
//   install(files: FileObject[]): Promise<
//     Result<{
//       failed?: {
//         fileKey: string;
//         reason: I18nStringType;
//       }[];
//     }>
//   >;

//   /** 列出插件 */
//   list(arg: {
//     types?: PluginTypeType[];
//     tags?: PluginTagType[];
//     op?: 'or' | 'and';
//   }): Promise<Result<T[]>>;

//   /** 列出插件标签 */
//   listTags(): Promise<Result<PluginTagListType>>;

//   // Configs
//   /** 获取插件配置, 插件配置是对某个插件的所有版本进行设置的 */
//   getConfig(pluginId: string): Promise<Result<C>>;
//   /** 设置插件配置, 插件配置是对某个插件的所有版本进行设置的 */
//   setConfig(pluginId: string, config: C): Promise<Result>;
// }
