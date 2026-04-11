import z from 'zod';

import { FileCreateSchema, FileMetaSchema } from '../value-objects/file/file.vo';
import type { Result } from '../value-objects/result.vo';

export const InvokeUploadFileInputSchema = z.object({
  ...FileCreateSchema.omit({
    fileKey: true, // 不允许自定义 fileKey
    overwrite: true, // 不允许自定义是否覆盖（默认覆盖）,
    path: true
  }).shape
});

export const InvokeUploadFileOutputSchema = z.object({
  ...FileMetaSchema.omit({
    fileKey: true
  }).shape,
  accessURL: z.string()
});

export type InvokeUploadFileInputType = z.infer<typeof InvokeUploadFileInputSchema>;
export type InvokeUploadFileOutputType = z.infer<typeof InvokeUploadFileOutputSchema>;

export const InvokeMethodEnumSchema = z.enum([
  'uploadFile'
  // 'chatCompletion',
  // 'datasetQuery',
  // 'userInfo',
  // 'teamInfo'
]);

export const InvokeMethodEnum = InvokeMethodEnumSchema.enum;
export type InvokeMethodType = z.infer<typeof InvokeMethodEnumSchema>;

/**
 * 反向调用 FastGPT 的能力
 */
export interface InvokePort {
  /** 上传文件 */
  uploadFile(input: InvokeUploadFileInputType): Promise<Result<InvokeUploadFileOutputType>>;

  // /** 模型调用 */
  // chatCompletion(): any;

  // /** 知识库搜索 */
  // datasetQuery(): any;

  // // 信息获取
  // // TODO
  // userInfo(): any; // 调用插件者的个人信息
  // teamInfo(): any; // 调用插件者的团队信息
}
