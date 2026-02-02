/**
 * Plugin Dataset Source ID 常量
 */
export const PluginDatasetSourceIds = {
  customApi: 'custom-api',
  feishu: 'feishu',
  yuque: 'yuque'
} as const;

export type PluginDatasetSourceId =
  (typeof PluginDatasetSourceIds)[keyof typeof PluginDatasetSourceIds];
