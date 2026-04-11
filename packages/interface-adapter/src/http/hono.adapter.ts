import {
  createRoute as createHonoRoute,
  OpenAPIHono,
  type RouteConfig,
  type RouteHandler
} from '@hono/zod-openapi';
import type {
  ContractItemType,
  RequestBodyType,
  RequestItemType,
  ResponseItemType
} from '../contracts/contract.type';
import type { InferResponse } from '../controllers/utils';

type RawControllerInput = {
  headers?: unknown;
  query?: unknown;
  params?: unknown;
  body?: unknown;
  formData?: FormData;
  contentType?: string;
};

export type ControllerHandler<C extends ContractItemType> = (
  input: RawControllerInput
) => Promise<InferResponse<C>>;

const methodMap = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  DELETE: 'delete',
  PATCH: 'patch'
} as const;

const toOpenAPIPath = (path: string) => path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');

const toRequestBody = (body?: RequestBodyType) => {
  if (!body) {
    return undefined;
  }

  return {
    content: Object.fromEntries(
      Object.entries(body).map(([contentType, schema]) => [contentType, { schema }])
    )
  };
};

const toRequest = (request?: RequestItemType) => {
  if (!request) {
    return undefined;
  }

  return {
    ...(request.headers ? { headers: request.headers } : {}),
    ...(request.query ? { query: request.query } : {}),
    ...(request.params ? { params: request.params } : {}),
    ...(request.body ? { body: toRequestBody(request.body) } : {})
  };
};

const toResponseItem = (status: number, response?: ResponseItemType) => {
  if (!response) {
    return undefined;
  }

  return {
    description: `HTTP ${status} response`,
    ...(response.body
      ? {
          content: Object.fromEntries(
            Object.entries(response.body).map(([contentType, schema]) => [contentType, { schema }])
          )
        }
      : {})
  };
};

const toResponses = (response: ContractItemType['response']) => {
  return Object.fromEntries(
    Object.entries(response)
      .map(([status, item]) => [Number(status), toResponseItem(Number(status), item)])
      .filter((entry): entry is [number, NonNullable<ReturnType<typeof toResponseItem>>] => {
        return entry[1] !== undefined;
      })
  );
};

const normalizeContentType = (contentType?: string) => contentType?.split(';', 1)[0]?.trim();

const hasFormBody = (contract: ContractItemType) =>
  Boolean(contract.request?.body && 'multipart/form-data' in contract.request.body);

const hasJsonBody = (contract: ContractItemType) =>
  Boolean(contract.request?.body && 'application/json' in contract.request.body);

const buildHeadersObject = (headers: Headers) => {
  const values: Record<string, string> = {};

  headers.forEach((value, key) => {
    values[key] = value;

    const canonicalKey = key
      .split('-')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join('-');
    values[canonicalKey] = value;
  });

  return values;
};

const readBody = async (request: Request, contract: ContractItemType) => {
  const contentType = normalizeContentType(request.headers.get('content-type') ?? undefined);

  if (!contract.request?.body) {
    return {
      contentType
    };
  }

  if (hasFormBody(contract)) {
    return {
      contentType,
      formData: await request.formData()
    };
  }

  if (hasJsonBody(contract)) {
    return {
      contentType,
      body: await request.json()
    };
  }

  return {
    contentType,
    body: await request.text()
  };
};

const responseToHeaders = (output: InferResponse<ContractItemType>) => {
  const headers = new Headers(
    (('headers' in output ? output.headers : undefined) ?? {}) as HeadersInit | undefined
  );

  if ('contentType' in output) {
    headers.set('content-type', output.contentType);
  }

  return headers;
};

const headersToRecord = (headers: Headers) => {
  const values: Record<string, string> = {};
  headers.forEach((value, key) => {
    values[key] = value;
  });
  return values;
};

export const createRoute = <const C extends ContractItemType>(contract: C) =>
  createHonoRoute({
    method: methodMap[contract.method],
    path: toOpenAPIPath(contract.path),
    operationId: contract.operationId,
    summary: contract.summary,
    description: contract.description,
    tags: contract.tags,
    security: contract.security
      ? contract.security.map((item) =>
          Object.fromEntries(Object.entries(item).map(([key, value]) => [key, [...value]]))
        )
      : undefined,
    ...(contract.request ? { request: toRequest(contract.request) } : {}),
    responses: toResponses(contract.response)
  } as RouteConfig);

export const adaptController = <const C extends ContractItemType>(
  contract: C,
  controller: ControllerHandler<C>
) =>
  (async (c) => {
    const requestBody = await readBody(c.req.raw, contract);
    const output = await controller({
      headers: buildHeadersObject(c.req.raw.headers),
      query: c.req.query(),
      params: c.req.param(),
      ...requestBody
    });

    if (!('contentType' in output)) {
      return new Response(null, {
        status: output.status,
        headers: responseToHeaders(output)
      });
    }

    const headers = responseToHeaders(output);

    if (output.contentType === 'application/json') {
      return c.json(output.body, output.status as never, headersToRecord(headers));
    }

    return new Response(
      typeof output.body === 'string' ? output.body : JSON.stringify(output.body),
      {
        status: output.status,
        headers
      }
    );
  }) satisfies RouteHandler<ReturnType<typeof createRoute>>;

export const registerRoute = <const C extends ContractItemType>(
  app: OpenAPIHono,
  contract: C,
  controller: ControllerHandler<C>
) => {
  const route = createRoute(contract);
  app.openapi(route, adaptController(contract, controller));
  return app;
};

export const honoRoute = () => new OpenAPIHono();
