import { getMongoModel } from '..';
import { z } from 'zod';
import { Schema } from 'mongoose';

export const pluginTypeEnum = z.enum(['tool']);

export const PluginZodSchema = z.object({
  type: z.literal('tool'),
  toolId: z.string(),
  status: z.enum(['active', 'pending', 'inactive'])
});

export type MongoPluginSchemaType = z.infer<typeof PluginZodSchema>;

const pluginMongooseSchema = new Schema({
  toolId: { type: String },
  type: { type: String, required: true, enum: Object.values(pluginTypeEnum.Enum) },
  status: {
    type: String,
    required: true,
    enum: Object.values(PluginZodSchema.shape.status.enum)
  }
});

pluginMongooseSchema.index({ toolId: 1 }, { unique: true, sparse: true });
pluginMongooseSchema.index({ type: 1 });

export const MongoPlugin = getMongoModel('fastgpt_plugins', pluginMongooseSchema);
