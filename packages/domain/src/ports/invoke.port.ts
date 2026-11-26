import type { Readable } from 'node:stream';

import z from 'zod';

import { FileCreateSchema, FileMetaSchema } from '../value-objects/file/file.vo';
import { failureResult, type Result, successResult } from '../value-objects/result.vo';
import type { StreamData } from '../value-objects/stream.vo';

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

const rawInvokeMethodEnumSchema = z.enum([
  'uploadFile',
  'userInfo',
  'wecomCorpToken',
  'chatCompletion',
  'unknown'
  // 'datasetQuery',
  // 'teamInfo'
]);

export const InvokeMethodEnum = rawInvokeMethodEnumSchema.enum;
export const InvokeMethodEnumSchema = rawInvokeMethodEnumSchema.catch(
  InvokeMethodEnum.unknown
);
export type InvokeMethodType = z.infer<typeof InvokeMethodEnumSchema>;

export type InvokeWecomCorpTokenOutputType = {
  access_token: string;
  expires_in: number;
};

export const InvokeChatCompletionInputSchema = z.object({
  body: z.record(z.string(), z.unknown()),
  headers: z.record(z.string(), z.string()).optional()
});

export type InvokeChatCompletionInputType = z.infer<typeof InvokeChatCompletionInputSchema>;

export type InvokeChatCompletionStreamChunkType = Uint8Array | string;

export type InvokeChatCompletionStreamSourceType =
  | Readable
  | StreamData<InvokeChatCompletionStreamChunkType>;

export type InvokeChatCompletionJsonOutputType = {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  stream?: undefined;
};

export type InvokeChatCompletionStreamOutputType = {
  status: number;
  headers: Record<string, string>;
  stream: InvokeChatCompletionStreamSourceType;
  body?: undefined;
};

export type InvokeChatCompletionOutputType =
  | InvokeChatCompletionJsonOutputType
  | InvokeChatCompletionStreamOutputType;

export type InvokeChatCompletionReplyMetaType = {
  status: number;
  headers: Record<string, string>;
  body?: unknown;
};

/**
 * Normalizes and validates raw `chatCompletion` arguments from channel requests.
 * Accepts either `{ body, headers? }` or a plain OpenAI request body object directly.
 */
export function parseInvokeChatCompletionInput(
  raw: unknown
): Result<InvokeChatCompletionInputType> {
  const candidate =
    raw && typeof raw === 'object' && !Array.isArray(raw) && !('body' in raw)
      ? { body: raw }
      : raw;
  const parsed = InvokeChatCompletionInputSchema.safeParse(candidate);
  if (!parsed.success) {
    return failureResult(
      {
        en: 'Invalid invoke chat completion input',
        'zh-CN': '反向调用模型参数格式错误'
      },
      parsed.error
    );
  }
  return successResult(parsed.data);
}

/**
 * Reverse invocation capabilities provided by the FastGPT host.
 */
export interface InvokePort {
  /** Upload a file to FastGPT */
  uploadFile(input: InvokeUploadFileInputType): Promise<Result<InvokeUploadFileOutputType>>;
  userInfo(): Promise<Result<InvokeUserInfoOutputType>>;
  getWecomCorpToken(): Promise<Result<InvokeWecomCorpTokenOutputType>>;
  /** Proxy OpenAI-compatible chat completions through FastGPT */
  chatCompletion?(
    input: InvokeChatCompletionInputType,
    options?: { signal?: AbortSignal }
  ): Promise<Result<InvokeChatCompletionOutputType>>;

  // /** 知识库搜索 */
  // datasetQuery(): any;

  // // 信息获取
  // // TODO
  // teamInfo(): any; // 调用插件者的团队信息
}
