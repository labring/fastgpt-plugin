/**
 * 设置 Plugin 在 PluginManager 中的相关配置
 * Local 模式下：可设置
 *  - minPods: 最小 pod 数
 *  - maxPods: 最大 pod 数
 *  - maxConcurrentRequestsPerPod: 每个 pod 的最大并发请求数
 *  - maxIdleSeconds: 最大空闲时间（秒）
 */

import { Schema } from 'mongoose';
import { getMongoModel } from '..';

const MongoProcessConfigSchema = new Schema(
  {
    minPods: { type: Number },
    maxPods: { type: Number },
    maxConcurrentRequestsPerPod: { type: Number },
    maxIdleSeconds: { type: Number }
  },
  {
    _id: false
  }
);

const MongoPluginConfigSchema = new Schema({
  pluginId: { type: String, required: true },
  version: { type: String },
  etag: { type: String },
  processConfig: {
    type: MongoProcessConfigSchema
  },
  updatedAt: { type: Date, default: Date.now }
});

MongoPluginConfigSchema.index({ pluginId: 1, version: 1, etag: 1 }, { unique: true });
MongoPluginConfigSchema.index({ pluginId: 1 });

export const MongoPluginConfig = getMongoModel('plugin_configs', MongoPluginConfigSchema);
