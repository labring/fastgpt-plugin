import { Schema, Types } from 'mongoose';

import pluginModel from './plugin.model';
import { defineModel } from './utils';

const model = defineModel(
  'plugin_installations',
  new Schema(
    {
      source: { type: String, required: true },

      pluginId: { type: String, required: true },
      version: { type: String, required: true },
      etag: { type: String, required: true },

      status: {
        type: String,
        required: true,
        default: 'active',
        enum: ['pending', 'active', 'disabled']
      },
      expiredAt: { type: Date },

      createAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },

      pluginObjectId: { type: Types.ObjectId, required: true }
    },
    {
      virtuals: {
        plugin: {
          options: {
            ref: pluginModel.name,
            localField: 'pluginObjectId',
            foreignField: '_id',
            justOne: true
          }
        }
      }
    }
  )
    .index({ source: 1, pluginId: 1, version: 1, etag: 1 }, { unique: true })
    .index(
      { source: 1, pluginId: 1, version: 1 },
      { unique: true, partialFilterExpression: { status: 'active' } }
    )
    .index({ expiredAt: 1 }, { expireAfterSeconds: 0 })
);
export default model;
