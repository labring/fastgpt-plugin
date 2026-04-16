/**
 * 设置 Plugin 在 PluginManager 中的相关配置
 */
import { Schema } from 'mongoose';

import { defineModel } from './utils';

const model = defineModel(
  'plugin_runtime_configs',
  new Schema({
    pluginId: { type: String, required: true },
    config: { type: Object, required: true },
    updatedAt: { type: Date, default: Date.now }
  })
    .index({ pluginId: 1, version: 1, etag: 1 }, { unique: true })
    .index({ pluginId: 1 })
);

export default model;
