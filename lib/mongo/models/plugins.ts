import { getMongoModel } from '..';
import { z } from 'zod';
import { Schema } from 'mongoose';

export const pluginTypeEnum = z.enum(['tool']);

export const PluginZodSchema = z.object({
  type: z.literal('tool'),
  toolId: z.string(),
  status: z.enum(['active', 'pending']),
  ttl: z.date().optional()
});

export type MongoPluginSchemaType = z.infer<typeof PluginZodSchema>;

const pluginMongooseSchema = new Schema({
  toolId: { type: String },
  type: { type: String, required: true, enum: Object.values(pluginTypeEnum.Enum) },
  status: {
    type: String,
    required: true,
    enum: Object.values(PluginZodSchema.shape.status.enum)
  },
  ttl: {
    type: Date
  }
});

pluginMongooseSchema.index({ toolId: 1 }, { unique: true, sparse: true });
pluginMongooseSchema.index({ type: 1 });
pluginMongooseSchema.index(
  { ttl: 1 },
  {
    expireAfterSeconds: 0
  }
);

export const MongoPlugin = getMongoModel('fastgpt_plugins', pluginMongooseSchema);
