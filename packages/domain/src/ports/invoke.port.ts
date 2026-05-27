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
  }).partial().shape,
  accessURL: z.string()
});

export type InvokeUploadFileInputType = z.infer<typeof InvokeUploadFileInputSchema>;
export type InvokeUploadFileOutputType = z.infer<typeof InvokeUploadFileOutputSchema>;

export const InvokeUserInfoOutputSchema = z.object({
  username: z.string(),
  contact: z.string().nullish(),
  memberName: z.string().nullish(),
  orgs: z.array(
    z.object({
      pathId: z.string(),
      name: z.string()
    })
  ),
  groups: z.array(z.object({ name: z.string() }))
});

export type InvokeUserInfoOutputType = z.infer<typeof InvokeUserInfoOutputSchema>;

export const InvokeMethodEnumSchema = z.enum([
  'uploadFile',
  'userInfo',
  'wecomCorpToken'
  // 'chatCompletion',
  // 'datasetQuery',
  // 'teamInfo'
]);

export const InvokeMethodEnum = InvokeMethodEnumSchema.enum;
export type InvokeMethodType = z.infer<typeof InvokeMethodEnumSchema>;

export type InvokeWecomCorpTokenOutputType = {
  access_token: string;
  expires_in: number;
};

/**
 * 反向调用 FastGPT 的能力
 */
export interface InvokePort {
  /** 上传文件 */
  uploadFile(input: InvokeUploadFileInputType): Promise<Result<InvokeUploadFileOutputType>>;
  userInfo(): Promise<Result<InvokeUserInfoOutputType>>; // 调用插件者的个人信息
  getWecomCorpToken(): Promise<Result<InvokeWecomCorpTokenOutputType>>; // 获取企业微信企业令牌

  // /** 模型调用 */
  // chatCompletion(): any;

  // /** 知识库搜索 */
  // datasetQuery(): any;

  // // 信息获取
  // // TODO
  // teamInfo(): any; // 调用插件者的团队信息
}
