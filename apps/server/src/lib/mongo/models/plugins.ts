import { getMongoModel } from '..';
import { z } from 'zod';
import { Schema } from 'mongoose';

export const pluginTypeSchema = z.enum(['tool']);
export const pluginTypeEnum = pluginTypeSchema.enum;

export const PluginVersionChildItemSchema = z.object({
  toolId: z.string(),
  inputSchema: z.any().optional(),
  outputSchema: z.any().optional()
});

export const PluginVersionItemSchema = z.object({
  value: z.string(),
  inputSchema: z.any().optional(),
  outputSchema: z.any().optional(),
  children: z.array(PluginVersionChildItemSchema).optional()
});

export const PluginConfigSchema = z.object({
  minPods: z.number().int().min(0).optional(),
  maxPods: z.number().int().positive().optional(),
  maxConcurrentRequestsPerPod: z.number().int().positive().optional()
});

export const PluginZodSchema = z.object({
  type: z.literal('tool'),
  /** 基础工具 ID，格式 author@name，不含版本号 */
  toolId: z.string(),
  versionList: z.array(PluginVersionItemSchema).optional(),
  /** 进程池配置，对该工具所有版本生效，可覆盖环境变量默认值 */
  pluginConfig: PluginConfigSchema.optional()
});

export type MongoPluginSchemaType = z.infer<typeof PluginZodSchema>;
export type PluginVersionItemType = z.infer<typeof PluginVersionItemSchema>;
export type PluginConfigType = z.infer<typeof PluginConfigSchema>;

const versionChildSchema = new Schema(
  {
    toolId: { type: String, required: true },
    inputSchema: { type: Schema.Types.Mixed },
    outputSchema: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const versionItemSchema = new Schema(
  {
    value: { type: String, required: true },
    inputSchema: { type: Schema.Types.Mixed },
    outputSchema: { type: Schema.Types.Mixed },
    children: { type: [versionChildSchema], default: undefined }
  },
  { _id: false }
);

const pluginConfigMongoSchema = new Schema(
  {
    minPods: { type: Number },
    maxPods: { type: Number },
    maxConcurrentRequestsPerPod: { type: Number }
  },
  { _id: false }
);

const pluginMongooseSchema = new Schema({
  toolId: { type: String, required: true },
  type: { type: String, required: true, enum: Object.values(pluginTypeEnum) },
  versionList: { type: [versionItemSchema], default: [] },
  pluginConfig: { type: pluginConfigMongoSchema },

  // @deprecated
  objectName: { type: String },
  version: { type: String }
});

pluginMongooseSchema.index({ type: 1, toolId: 1 }, { unique: true });

export const MongoSystemPlugin = getMongoModel('system_plugins', pluginMongooseSchema);
