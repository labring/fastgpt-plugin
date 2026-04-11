/**
 * 提供 Contract, 要求
 * 1. 静态的，静态类型检查能拿到
 * 2. 在构建 controller 时能引用
 * 3. 在构建 openapi 文档时能直接引用，通过一个 transform 能编程 openapi 对象
 * 4. 在构建 client sdk 时能引用
 * 5. 使用 zod 构建，填写 meta 信息以及 openapi 信息
 */

import z, { type ZodType } from 'zod';

import type { MIMEType } from '@domain/value-objects/file/MIME.vo';

import { type HTTPMethodType, type StatusCodeType } from '../http/http.type';

export const OpenAPITagsEnum = {
  plugin: 'plugin',
  tool: 'tool'
} as const;

export type OpenAPITagsType = (typeof OpenAPITagsEnum)[keyof typeof OpenAPITagsEnum];

export type RequestBodyType = Partial<Record<MIMEType & string, ZodType>>;
export type RequestItemType = {
  headers?: ZodType;
  body?: RequestBodyType;
  query?: ZodType;
  params?: ZodType;
};

export type ResponseItemType<
  B extends RequestBodyType | undefined = RequestBodyType | undefined,
  H extends ZodType | undefined = ZodType | undefined
> = {
  body?: B;
  headers?: H;
};

export type ContractItemType = {
  /** 路径，需要写绝对路径 */
  path: string;
  /** 操作 ID，用于生成 Client SDK，需要唯一性 */
  operationId: string;
  /** HTTP 方法 */
  method: HTTPMethodType;
  /** 请求体 */
  request?: RequestItemType;
  /** 响应 */
  response: Partial<Record<StatusCodeType, ResponseItemType>>;
  /** 摘要 */
  summary?: string;
  /** 描述 */
  description?: string;
  /** 标签 */
  tags?: OpenAPITagsType[];
  security?: readonly Record<string, readonly string[]>[];
};

// export const buildJSONRequestSchema = <D extends ZodType | undefined>({ data }: { data?: D }) => ({
//   ...(data && { data })
// });

export const defineContract = <const C extends ContractItemType>(contract: C) => contract;

export const defineRequest = <const R extends RequestItemType>(request: R) => request;

export const defineResponse = <
  B extends RequestBodyType | undefined = undefined,
  H extends ZodType | undefined = undefined
>({
  body,
  headers
}: {
  body?: B;
  headers?: H;
} = {}) =>
  ({
    ...(body && { body }),
    ...(headers && { headers })
  }) as ResponseItemType<B, H>;

export const jsonBody = <S extends ZodType>(schema: S) =>
  ({
    'application/json': schema
  }) as const;

export const formDataBody = <S extends ZodType>(schema: S) =>
  ({
    'multipart/form-data': schema
  }) as const;

export const emptyResponse = () => defineResponse();

export const buildJSONResponseSchema = <
  D extends ZodType | undefined,
  E extends ZodType | undefined = undefined
>({
  data,
  error
}: {
  data?: D;
  error?: E;
}) =>
  z.object({
    ...(data && { data }),
    ...(error && { error })
  });

export const jsonResponse = <
  D extends ZodType | undefined,
  E extends ZodType | undefined = undefined,
  H extends ZodType | undefined = undefined
>({
  data,
  error,
  headers
}: {
  data?: D;
  error?: E;
  headers?: H;
} = {}) =>
  defineResponse({
    body: jsonBody(buildJSONResponseSchema({ data, error })),
    headers
  });
