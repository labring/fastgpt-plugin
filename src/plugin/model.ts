import { getMongoModel } from '../utils/mongo';
import { z } from 'zod';
import mongoose from 'mongoose';

export const PluginZodSchema = z.object({
  toolId: z.string(),
  url: z.string().optional(),
  type: z.literal('tool').default('tool')
});

export type PluginDocument = z.infer<typeof PluginZodSchema>;

const pluginMongooseSchema = new mongoose.Schema({
  toolId: { type: String, required: true },
  url: { type: String, required: false },
  type: { type: String, required: true, default: 'tool' }
});

pluginMongooseSchema.index({ toolId: 1 }, { unique: true });
pluginMongooseSchema.index({ url: 1 }, { unique: true });
pluginMongooseSchema.index({ type: 1 });

export const PluginModel = getMongoModel<PluginDocument>('fastgpt_plugins', pluginMongooseSchema);
