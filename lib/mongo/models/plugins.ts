import { getMongoModel } from '..';
import { z } from 'zod';
import { Schema } from 'mongoose';

export const pluginTypeEnum = z.enum(['tool']);

export const PluginZodSchema = z
  .object({
    objectName: z.string()
  })
  .merge(
    z.object({
      type: z.literal('tool'),
      toolId: z.string()
    })
  );

export type MongoPluginSchemaType = z.infer<typeof PluginZodSchema>;

const pluginMongooseSchema = new Schema({
  toolId: { type: String },
  objectName: { type: String, required: true, unique: true },
  type: { type: String, required: true, enum: Object.values(pluginTypeEnum.Enum) }
});

pluginMongooseSchema.index({ toolId: 1 }, { unique: true, sparse: true });
pluginMongooseSchema.index({ type: 1 });

export const MongoPluginModel = getMongoModel<MongoPluginSchemaType>(
  'fastgpt_plugins',
  pluginMongooseSchema
);
