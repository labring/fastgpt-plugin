import { getMongoModel } from '..';
import { z } from 'zod';
import { Schema } from 'mongoose';

export const pluginTypeEnum = z.enum(['tool']);

export const PluginZodSchema = z.object({
  type: z.literal('tool'),
  toolId: z.string()
});

export type MongoPluginSchemaType = z.infer<typeof PluginZodSchema>;

const pluginMongooseSchema = new Schema({
  toolId: { type: String, required: true },
  type: { type: String, required: true, enum: Object.values(pluginTypeEnum.enum) },

  // @deprecated
  objectName: { type: String }
});

pluginMongooseSchema.index({ type: 1, toolId: 1 }, { unique: true });

export const MongoSystemPlugin = getMongoModel('system_plugins', pluginMongooseSchema);
