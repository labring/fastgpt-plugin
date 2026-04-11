import { Schema } from 'mongoose';

import { PluginTypeEnum } from '@domain/entities/plugin.entity';
import { PluginSourceEnum } from '@domain/value-objects/plugin.vo';

import { defineModel } from './utils';

/**
 * 底层 Plugin Schema
 * 唯一索引： pluginId + version + etag
 */
const model = defineModel(
  'system_plugins',
  new Schema({
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
    updateAt: { type: Date, default: Date.now },
    pending: { type: Boolean, require: false },
    expiredAt: { type: Date, required: false }
  })
    .index({ pluginId: 1, version: 1, etag: 1 }, { unique: true }) // unique index for plugin version
    .index({ expiredAt: 1 }, { expireAfterSeconds: 0 }) // for cleaning the pending plugins automatically
);

export default model;
