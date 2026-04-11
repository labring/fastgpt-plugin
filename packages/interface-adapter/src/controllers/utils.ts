import z from 'zod';

import type {
  ContractItemType,
  RequestBodyType,
  RequestItemType,
  ResponseItemType
} from '../contracts/contract.type';

type InferSchema<T> = T extends z.ZodType ? z.infer<T> : never;

type InferRequestBody<T> =
  T extends Record<string, z.ZodType>
    ? {
        [K in keyof T]: {
          contentType: K;
          body: z.infer<T[K]>;
        };
      }[keyof T]
    : never;

export type InferRequest<C extends ContractItemType> = {
  headers: C['request'] extends { headers: infer H } ? InferSchema<H> : undefined;
  query: C['request'] extends { query: infer Q } ? InferSchema<Q> : undefined;
  params: C['request'] extends { params: infer P } ? InferSchema<P> : undefined;
  body: C['request'] extends { body: infer B } ? InferRequestBody<B> : undefined;
};

type InferResponseItem<R> =
  R extends ResponseItemType<infer B, infer H>
    ? (B extends Record<string, z.ZodType>
        ? {
            [K in keyof B]: {
              contentType: K;
              body: z.infer<B[K]>;
            };
          }[keyof B]
        : object) & {
        headers?: InferSchema<H>;
      }
    : never;

export type InferResponse<C extends ContractItemType> = {
  [S in keyof C['response'] & number]: {
    status: S;
  } & InferResponseItem<NonNullable<C['response'][S]>>;
}[keyof C['response'] & number];

type RawControllerInput = {
  headers?: unknown;
  query?: unknown;
  params?: unknown;
  body?: unknown;
  formData?: FormData;
  contentType?: string;
};

const parseSchema = <S extends z.ZodType | undefined>(schema: S, value: unknown) => {
  if (!schema) {
    return undefined as InferSchema<S>;
  }

  return schema.parse(value) as InferSchema<S>;
};

const parseRequestBody = <B extends RequestBodyType | undefined>(
  body: B,
  rawBody: unknown,
  rawContentType?: string
) => {
  if (!body) {
    return undefined as InferRequestBody<B>;
  }

  const entries = Object.entries(body) as [keyof NonNullable<B>, z.ZodType][];
  if (entries.length === 0) {
    return undefined as InferRequestBody<B>;
  }

  if (entries.length === 1) {
    const [contentType, schema] = entries[0];
    const normalizedBody =
      contentType === 'multipart/form-data' && rawBody instanceof FormData
        ? (() => {
            const formDataBody: Record<string, FormDataEntryValue> = {};
            rawBody.forEach((value, key) => {
              formDataBody[key] = value;
            });
            return formDataBody;
          })()
        : rawBody;

    return {
      contentType,
      body: schema.parse(normalizedBody)
    } as InferRequestBody<B>;
  }

  if (!rawContentType) {
    throw new Error('contentType is required when request body supports multiple mime types');
  }

  const schema = (body as Record<string, z.ZodType | undefined>)[rawContentType];
  if (!schema) {
    throw new Error(`Unsupported request content type: ${rawContentType}`);
  }

  return {
    contentType: rawContentType as keyof NonNullable<B>,
    body: schema.parse(rawBody)
  } as InferRequestBody<B>;
};

const parseRequest = <R extends RequestItemType | undefined>(
  request: R,
  rawInput: RawControllerInput
) => {
  const rawBody = rawInput.formData ?? rawInput.body;

  if (!request) {
    return {
      headers: undefined,
      query: undefined,
      params: undefined,
      body: undefined
    };
  }

  return {
    headers: parseSchema(request.headers, rawInput.headers),
    query: parseSchema(request.query, rawInput.query),
    params: parseSchema(request.params, rawInput.params),
    body: parseRequestBody(request.body, rawBody, rawInput.contentType)
  };
};

const validateResponse = <C extends ContractItemType>(contract: C, output: InferResponse<C>) => {
  const status = output.status;
  const response = contract.response[status];
  if (!response) {
    throw new Error(`Unexpected response status: ${status}`);
  }

  if (response.headers && 'headers' in output) {
    response.headers.parse(output.headers);
  }

  if (!response.body) {
    return output;
  }

  if (!('contentType' in output)) {
    throw new Error(`Response body for status ${status} is missing contentType`);
  }

  const schema = response.body[output.contentType];
  if (!schema) {
    throw new Error(`Unsupported response content type: ${String(output.contentType)}`);
  }

  schema.parse(output.body);

  return output;
};

export const buildController = <D extends object, const C extends ContractItemType>({
  contract,
  handler
}: {
  contract: C;
  handler: (deps: D) => (input: InferRequest<C>) => Promise<InferResponse<C>>;
}) => {
  return (deps: D) => async (rawInput: RawControllerInput) => {
    const input = parseRequest(contract.request, rawInput) as InferRequest<C>;
    const output = await handler(deps)(input);
    return validateResponse(contract, output);
  };
};
