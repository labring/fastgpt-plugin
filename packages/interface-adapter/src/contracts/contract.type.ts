import z, { type ZodType } from 'zod';

import type { StatusCodeType } from '../http/http.type';

export const OpenAPITagsEnum = {
  plugin: 'plugin',
  tool: 'tool'
} as const;

export type OpenAPITagsType = (typeof OpenAPITagsEnum)[keyof typeof OpenAPITagsEnum];
export type ContractMethodType = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type ContractMetaType = {
  path: string;
  method: ContractMethodType;
  operationId: string;
  summary?: string;
  description?: string;
  tags?: OpenAPITagsType[];
  security?: readonly Record<string, readonly string[]>[];
};

export type ContractItemType<
  Req extends ZodType | undefined = ZodType | undefined,
  Res extends Partial<Record<StatusCodeType, ZodType | undefined>> = Partial<
    Record<StatusCodeType, ZodType | undefined>
  >
> = {
  meta: ContractMetaType;
  request?: Req;
  response: Res;
};

export const defineContract = <
  Req extends ZodType | undefined,
  Res extends Partial<Record<StatusCodeType, ZodType | undefined>>,
  const C extends ContractItemType<Req, Res>
>(
  contract: C
) => contract;

export const emptyResponse = () => undefined;

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
  E extends ZodType | undefined = undefined
>({
  data,
  error
}: {
  data?: D;
  error?: E;
} = {}) => buildJSONResponseSchema({ data, error });
