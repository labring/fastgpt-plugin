/**
 * 底层 Plugin Schema
 * 唯一索引： pluginId + version + etag
 */
import { PluginSourceEnum } from '@fastgpt-plugin/domain/value-objects/plugin.vo';
import { getMongoModel } from '..';
import { Schema } from 'mongoose';
import { PluginTypeEnum } from '@fastgpt-plugin/domain/entities/plugin.entity';
const pluginMongooseSchema = new Schema({
  pluginId: { type: String, required: true },
  version: { type: String, required: true },
  etag: { type: String, required: true },

  type: { type: String, required: true, enum: Object.values(PluginTypeEnum) },
  source: {
    type: String,
    required: true,
    enum: Object.values(PluginSourceEnum),
    default: PluginSourceEnum.system
  },

  author: { type: String },
  name: { type: Object, required: true },
  icon: { type: String, required: true },
  tutorialUrl: { type: String, required: false },
  readmeUrl: { type: String, required: false },
  description: { type: Object, required: false },
  tags: { type: [String], required: false },
  versionDescription: { type: Object, required: false },

  meta: { type: Object, required: false },
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now }
});

pluginMongooseSchema.index({ pluginId: 1, version: 1, etag: 1 }, { unique: true });

export const MongoSystemPlugin = getMongoModel('system_plugins', pluginMongooseSchema);
