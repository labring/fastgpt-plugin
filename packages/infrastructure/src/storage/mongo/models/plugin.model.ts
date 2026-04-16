import { type InferSchemaType, Schema } from 'mongoose';

import { PluginTypeEnum } from '@domain/entities/plugin.entity';
import { PluginStatusEnum } from '@domain/entities/plugin-base.entity';

import { defineModel } from './utils';
const schema = new Schema({
  // 使用这三个字段来唯一标识一个插件版本，etag 用于区分同一 pluginId 和 version 的不同版本（比如不同的 source）
  pluginId: { type: String, required: true },
  version: { type: String, required: true },
  etag: { type: String, required: true },

  // 插件类型，不同类型的插件会有不同的配置项
  type: { type: String, required: true, enum: Object.values(PluginTypeEnum) },

  // 通用配置
  author: { type: String },
  name: { type: Object, required: true },
  icon: { type: String, required: true },

  tutorialUrl: { type: String, required: false },
  readmeUrl: { type: String, required: false },
  description: { type: Object, required: true },
  tags: { type: [String], required: false },
  versionDescription: { type: Object, required: false },
  repoUrl: { type: String, required: false },
  permission: { type: [String], required: false },

  // 不同类型有不同的数据
  data: { type: Object, required: true },

  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },

  // 插件状态，软删除
  status: {
    type: String,
    required: false,
    enum: Object.values(PluginStatusEnum),
    default: PluginStatusEnum.active
  },
  // 过期时间，过期后会被自动删除，适用于 pending 状态的插件, 自动删除记录
  expiredAt: { type: Date, required: false }
})
  .index({ pluginId: 1, version: 1, etag: 1 }, { unique: true }) // unique index for plugin version
  .index({ expiredAt: 1 }, { expireAfterSeconds: 0 }); // for cleaning the pending plugins automatically

export type MongoPluginSchemaType = InferSchemaType<typeof schema>;

/**
 * 底层 Plugin Schema
 * 唯一索引： pluginId + version + etag
 */
const model = defineModel('system_plugins', schema);

export default model;
