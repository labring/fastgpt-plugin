import { getMongoModel } from '../utils/mongo';
import { z } from 'zod';
import { Schema } from 'mongoose';

export const pluginTypeEnum = z.enum(['tool']);

export const PluginZodSchema = z
  .object({
    objectName: z.string(),
    digest: z.string()
  })
  .merge(
    z.object({
      type: z.literal('tool').default('tool'),
      toolId: z.string()
    })
  );

export type MongoPluginSchemaType = z.infer<typeof PluginZodSchema>;

const pluginMongooseSchema = new Schema({
  toolId: { type: String },
  objectName: { type: String },
  type: { type: String, required: true, enum: Object.values(pluginTypeEnum.Enum) }
});

pluginMongooseSchema.index({ url: 1 }, { unique: true });
pluginMongooseSchema.index({ type: 1 });

export const PluginModel = getMongoModel<MongoPluginSchemaType>(
  'fastgpt_plugins',
  pluginMongooseSchema
);
