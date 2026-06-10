import { isNotNil } from 'es-toolkit';
import type { Context, Env, Handler } from 'hono';
import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import z, { type ZodType } from 'zod';

import type { ErrorResponseType } from '@domain/value-objects/error.vo';
import { createError, toErrorResponse } from '@domain/value-objects/error.vo';
import type { I18nStringType } from '@domain/value-objects/i18n-string.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

type ResponseContextLike = Pick<Context, 'json' | 'body'>;
type OpenAPIMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';
type OpenAPIContent = Record<string, { schema: ZodType }>;

type OpenAPIRouteDefinition = {
  path: string;
  method: OpenAPIMethod;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  security?: readonly Record<string, readonly string[]>[];
  request?: {
    query?: ZodType;
    body?: {
      content: OpenAPIContent;
    };
  };
  responses: Record<
    string | number,
    {
      description: string;
      content?: OpenAPIContent;
    }
  >;
};

type OpenAPIComponentType = 'securitySchemes' | 'schemas' | 'parameters' | 'responses';
type OpenAPIComponents = Partial<Record<OpenAPIComponentType, Record<string, unknown>>>;
type OpenAPIDocConfig = {
  openapi: '3.1.0';
  info: Record<string, unknown>;
  security?: readonly Record<string, readonly string[]>[];
};
type OpenAPIState = {
  routes: OpenAPIRouteDefinition[];
  components: OpenAPIComponents;
};
type EmptyValidatedData = Record<never, never>;
type ValidatedData<T extends OpenAPIRouteDefinition> = (T extends {
  request: { query: infer Q extends ZodType };
}
  ? { query: z.output<Q> }
  : EmptyValidatedData) &
  (T extends {
    request: { body: { content: { 'application/json': { schema: infer B extends ZodType } } } };
  }
    ? { json: z.output<B> }
    : EmptyValidatedData);
type OpenAPIHandler<T extends OpenAPIRouteDefinition> = Handler<
  Env,
  string,
  { out: ValidatedData<T> }
>;
type OpenAPIHonoOptions<T extends Env> = ConstructorParameters<typeof Hono<T>>[0];
export type NativeOpenAPIHono<T extends Env = Env> = Hono<T> & {
  openapi: <const Route extends OpenAPIRouteDefinition>(
    route: Route,
    handler: OpenAPIHandler<Route>
  ) => NativeOpenAPIHono<T>;
  doc31: (path: string, config: OpenAPIDocConfig) => NativeOpenAPIHono<T>;
  openAPIRegistry: {
    registerComponent: (type: OpenAPIComponentType, name: string, component: unknown) => void;
  };
};

const openAPIState = new WeakMap<object, OpenAPIState>();

export const createRoute = <const Route extends OpenAPIRouteDefinition>(route: Route) => route;

export function appendHeaders(headers: Headers, appendHeaders?: HeadersInit) {
  const h = new Headers(headers);
  if (isNotNil(appendHeaders)) {
    const ah = new Headers(appendHeaders);
    ah.forEach((v, k) => void h.append(k, v));
  }
  return h;
}

function zodErrorToI18nString(error: z.ZodError): I18nStringType {
  const englishDetails = error.issues.map(formatValidationIssueEn).join('; ');
  const chineseDetails = error.issues.map(formatValidationIssueZh).join('; ');

  return {
    en: englishDetails ? `Validation failed: ${englishDetails}` : 'Validation failed',
    'zh-CN': chineseDetails ? `请求参数校验失败: ${chineseDetails}` : '请求参数校验失败'
  };
}

function normalizeError(
  status: ContentfulStatusCode,
  error: I18nStringType | z.ZodError | string | Error
): ErrorResponseType {
  if (error instanceof z.ZodError) {
    return toErrorResponse(createValidationError(error));
  }

  if (error instanceof Error) {
    return toErrorResponse(error);
  }

  if (typeof error === 'string') {
    return toErrorResponse(
      createError(getHttpErrorCode(status), {
        message: error,
        reason: {
          en: error,
          'zh-CN': error
        }
      })
    );
  }

  return toErrorResponse(
    createError(getHttpErrorCode(status), {
      message: error.en,
      reason: error
    })
  );
}

function success<T>(c: ResponseContextLike, data: T) {
  return c.json({ data }, 200);
}

function empty(c: ResponseContextLike) {
  return c.body(null, 200);
}

function fail<S extends ContentfulStatusCode>(
  c: ResponseContextLike,
  status: S,
  error: I18nStringType | z.ZodError | string | Error
) {
  return c.json({ error: normalizeError(status, error) }, status);
}

export const R = {
  success,
  empty,
  fail,
  error: fail
};

function getHttpErrorCode(status: ContentfulStatusCode): string {
  if (status === 400) return ErrorCode.badRequest;
  if (status === 401) return ErrorCode.unauthorized;
  if (status === 404) return ErrorCode.notFound;
  if (status >= 400 && status < 500) return ErrorCode.badRequest;
  return ErrorCode.internalServerError;
}

function getState(app: object): OpenAPIState {
  const existing = openAPIState.get(app);
  if (existing) {
    return existing;
  }

  const state: OpenAPIState = {
    routes: [],
    components: {}
  };
  openAPIState.set(app, state);
  return state;
}

function getFirstJSONBodySchema(route: OpenAPIRouteDefinition): ZodType | undefined {
  return route.request?.body?.content['application/json']?.schema;
}

function buildQueryTarget(c: Context) {
  const query = c.req.query();
  const multiValueQuery = c.req.queries();

  return {
    ...query,
    ...Object.fromEntries(
      Object.entries(multiValueQuery).map(([key, value]) => [
        key,
        value.length === 1 ? value[0] : value
      ])
    )
  };
}

function validationErrorResponse(c: Context, error: z.ZodError) {
  return R.fail(c, 400, createValidationError(error));
}

function createValidationError(error: z.ZodError): Error {
  const reason = zodErrorToI18nString(error);

  return createError(ErrorCode.validationFailed, {
    message: reason.en,
    reason,
    data: {
      issues: error.issues.map(toValidationIssue)
    }
  });
}

function toValidationIssue(issue: z.core.$ZodIssue): Record<string, unknown> {
  const issueRecord = issue as z.core.$ZodIssue & Record<string, unknown>;
  const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';

  return {
    path,
    message: issue.message,
    code: issue.code,
    ...(issueRecord.expected !== undefined ? { expected: issueRecord.expected } : {}),
    ...(issueRecord.received !== undefined ? { received: issueRecord.received } : {}),
    ...(issueRecord.options !== undefined ? { options: issueRecord.options } : {}),
    ...(issueRecord.minimum !== undefined ? { minimum: issueRecord.minimum } : {}),
    ...(issueRecord.maximum !== undefined ? { maximum: issueRecord.maximum } : {})
  };
}

function formatValidationIssueEn(issue: z.core.$ZodIssue): string {
  return `${getIssuePath(issue)}: ${issue.message}`;
}

function formatValidationIssueZh(issue: z.core.$ZodIssue): string {
  const issueRecord = issue as z.core.$ZodIssue & Record<string, unknown>;
  const path = getIssuePath(issue);

  if (issue.code === 'invalid_type') {
    const expected = issueRecord.expected;
    if (issue.message.includes('received undefined')) {
      return `${path}: 缺少必填字段`;
    }
    if (typeof expected === 'string') {
      return `${path}: 类型错误，应为 ${expected}`;
    }
  }

  return `${path}: ${issue.message}`;
}

function getIssuePath(issue: z.core.$ZodIssue): string {
  return issue.path.length > 0 ? issue.path.join('.') : '(root)';
}

async function validateRequest(c: Context, route: OpenAPIRouteDefinition) {
  const querySchema = route.request?.query;
  if (querySchema) {
    const result = await querySchema.safeParseAsync(buildQueryTarget(c));
    if (!result.success) {
      return validationErrorResponse(c, result.error);
    }
    c.req.addValidatedData('query', result.data as object);
  }

  const jsonSchema = getFirstJSONBodySchema(route);
  if (jsonSchema) {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      body = undefined;
    }

    const result = await jsonSchema.safeParseAsync(body);
    if (!result.success) {
      return validationErrorResponse(c, result.error);
    }
    c.req.addValidatedData('json', result.data as object);
  }

  return undefined;
}

function toOpenAPIPath(path: string) {
  return path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

function joinRoutePath(prefix: string, path: string) {
  const cleanPrefix = prefix === '/' ? '' : prefix.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanPrefix}${cleanPath}` || '/';
}

function stripJSONSchemaMarker(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map(stripJSONSchemaMarker);
  }

  const entries = Object.entries(schema)
    .filter(([key]) => key !== '$schema')
    .map(([key, value]) => [key, stripJSONSchemaMarker(value)]);
  return Object.fromEntries(entries);
}

function toSchemaObject(schema: ZodType) {
  return stripJSONSchemaMarker(z.toJSONSchema(schema));
}

function toContent(content: OpenAPIContent) {
  return Object.fromEntries(
    Object.entries(content).map(([contentType, item]) => [
      contentType,
      {
        schema: toSchemaObject(item.schema)
      }
    ])
  );
}

function toOpenAPIRequest(route: OpenAPIRouteDefinition) {
  const request: Record<string, unknown> = {};

  if (route.request?.query instanceof z.ZodObject) {
    const jsonSchema = toSchemaObject(route.request.query);
    const properties =
      jsonSchema && typeof jsonSchema === 'object' && 'properties' in jsonSchema
        ? (jsonSchema.properties as Record<string, unknown> | undefined)
        : undefined;
    const required =
      jsonSchema && typeof jsonSchema === 'object' && 'required' in jsonSchema
        ? new Set(jsonSchema.required as string[])
        : new Set<string>();

    request.parameters = Object.entries(properties ?? {}).map(([name, schema]) => ({
      name,
      in: 'query',
      required: required.has(name),
      schema
    }));
  }

  if (route.request?.body) {
    request.requestBody = {
      content: toContent(route.request.body.content)
    };
  }

  return request;
}

function buildOpenAPIDocument(state: OpenAPIState, config: OpenAPIDocConfig) {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const route of state.routes) {
    const path = toOpenAPIPath(route.path);
    const pathItem = (paths[path] ??= {});
    pathItem[route.method] = {
      operationId: route.operationId,
      summary: route.summary,
      description: route.description,
      tags: route.tags,
      security: route.security,
      ...toOpenAPIRequest(route),
      responses: Object.fromEntries(
        Object.entries(route.responses).map(([status, response]) => [
          status,
          {
            description: response.description,
            ...(response.content ? { content: toContent(response.content) } : {})
          }
        ])
      )
    };
  }

  return {
    ...config,
    components: state.components,
    paths
  };
}

/**
 * Create Hono instance with native Zod validation and local OpenAPI registry.
 */
export function createOpenAPIHono<T extends Env = Env>(
  options?: OpenAPIHonoOptions<T>
): NativeOpenAPIHono<T> {
  const app = new Hono<T>(options) as NativeOpenAPIHono<T>;
  const state = getState(app);
  const baseRoute = app.route.bind(app);

  app.openapi = (route, handler) => {
    state.routes.push(route);

    const method = route.method;
    app[method](route.path, async (c, next) => {
      const response = await validateRequest(c, route);
      if (response) {
        return response;
      }

      return handler(c as unknown as Parameters<typeof handler>[0], next);
    });

    return app;
  };

  app.doc31 = (path, config) => {
    app.get(path, (c) => c.json(buildOpenAPIDocument(state, config), 200));
    return app;
  };

  app.route = ((path: string, subApp: Hono) => {
    const routedApp = baseRoute(path, subApp);
    const childState = openAPIState.get(subApp);

    if (childState) {
      state.routes.push(
        ...childState.routes.map((route) => ({
          ...route,
          path: joinRoutePath(path, route.path)
        }))
      );

      for (const [type, components] of Object.entries(childState.components)) {
        const componentType = type as OpenAPIComponentType;
        state.components[componentType] ??= {};
        Object.assign(state.components[componentType], components);
      }
    }

    return routedApp;
  }) as NativeOpenAPIHono<T>['route'];

  app.openAPIRegistry = {
    registerComponent(type, name, component) {
      state.components[type] ??= {};
      state.components[type][name] = component;
    }
  };

  return app;
}
