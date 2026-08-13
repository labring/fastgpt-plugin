import { Schema } from 'mongoose';

import { defineModel } from './utils';

const model = defineModel(
  'plugin_pending_installations',
  new Schema({
    source: { type: String, required: true },
    pluginId: { type: String, required: true },
    version: { type: String, required: true },
    etag: { type: String, required: true },
    pluginObjectId: { type: Schema.Types.ObjectId },
    expiredAt: { type: Date, required: true }
  })
    .index({ source: 1, pluginId: 1, version: 1, etag: 1 }, { unique: true })
    .index({ expiredAt: 1 }, { expireAfterSeconds: 0 })
);

export default model;
