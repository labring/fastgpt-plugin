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

      pluginObjectId: { type: Types.ObjectId, require: true }
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
  ).index({ source: 1, pluginId: 1, version: 1 }, { unique: true })
);
export default model;
