import { getMongoModel } from '..';
import { z } from 'zod';
import { Schema } from 'mongoose';

export const pluginTypeSchema = z.enum(['tool']);
export const pluginTypeEnum = pluginTypeSchema.enum;

export const PluginZodSchema = z.object({
  type: z.literal('tool'),
  toolId: z.string(),
  version: z.string().optional()
});

export type MongoPluginSchemaType = z.infer<typeof PluginZodSchema>;

const pluginMongooseSchema = new Schema({
  toolId: { type: String, required: true },
  type: { type: String, required: true, enum: Object.values(pluginTypeEnum) },
  version: { type: String },

  // @deprecated
  objectName: { type: String }
});

pluginMongooseSchema.index({ type: 1, toolId: 1 }, { unique: true });

export const MongoSystemPlugin = getMongoModel('system_plugins', pluginMongooseSchema);
