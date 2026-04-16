import type { ClientRequestOptions, FastGPTPluginClientOptions, JsonObject } from './types';

type QueryPrimitive = string | number | boolean;
type QueryValue = QueryPrimitive | QueryPrimitive[] | null | undefined;
type QueryParams = Record<string, QueryValue>;

type RequestArgs = ClientRequestOptions & {
  path: string;
  method?: string;
  headers?: HeadersInit;
  query?: QueryParams;
  body?: BodyInit | JsonObject;
};

export class ClientTransport {
  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor({ baseUrl, token, fetch }: FastGPTPluginClientOptions) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.token = token;
    const resolvedFetch = fetch ?? globalThis.fetch;

    if (!resolvedFetch) {
      throw new Error('Global fetch is not available. Please provide fetch in client options.');
    }

    this.fetchImpl = resolvedFetch.bind(globalThis);
  }

  async requestData<T>({ path, ...args }: RequestArgs): Promise<T> {
    const response = await this.requestResponse({ path, ...args });
    const payload = await this.readBody(response);

    if (payload && typeof payload === 'object' && 'data' in payload) {
      return (payload as { data: T }).data;
    }

    return payload as T;
  }

  async requestEmpty({ path, ...args }: RequestArgs): Promise<void> {
    const response = await this.requestResponse({ path, ...args });
    await response.text().catch(() => undefined);
  }

  async requestResponse({
    path,
    method = 'GET',
    headers,
    query,
    body,
    signal
  }: RequestArgs): Promise<Response> {
    const url = this.buildUrl(path, query);
    const requestHeaders = new Headers(headers);

    if (this.token) {
      requestHeaders.set('Authorization', `Bearer ${this.token}`);
    }

    const requestBody = this.normalizeBody(body, requestHeaders);
    const response = await this.fetchImpl(url, {
      method: method.toUpperCase(),
      headers: requestHeaders,
      body: requestBody,
      signal
    });

    if (!response.ok) {
      throw await this.buildError(response);
    }

    return response;
  }

  private buildUrl(path: string, query?: QueryParams): string {
    const url = new URL(path, `${this.baseUrl}/`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value == null) continue;

        if (Array.isArray(value)) {
          for (const item of value) {
            url.searchParams.append(key, String(item));
          }
          continue;
        }

        url.searchParams.append(key, String(value));
      }
    }

    return url.toString();
  }

  private normalizeBody(body: RequestArgs['body'], headers: Headers): BodyInit | undefined {
    if (body == null) {
      return undefined;
    }

    if (this.isNativeBodyInit(body)) {
      return body;
    }

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return JSON.stringify(body);
  }

  private isNativeBodyInit(body: BodyInit | JsonObject): body is BodyInit {
    return (
      typeof body === 'string' ||
      (typeof Blob !== 'undefined' && body instanceof Blob) ||
      (typeof FormData !== 'undefined' && body instanceof FormData) ||
      (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) ||
      (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream) ||
      body instanceof ArrayBuffer ||
      ArrayBuffer.isView(body)
    );
  }

  private async readBody(response: Response): Promise<unknown> {
    const text = await response.text();

    if (!text) {
      return undefined;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private async buildError(response: Response): Promise<Error> {
    const payload = await this.readBody(response).catch(() => undefined);
    const message =
      this.extractErrorMessage(payload) ??
      `${response.status} ${response.statusText || 'Request failed'}`;

    return new Error(message);
  }

  private extractErrorMessage(payload: unknown): string | undefined {
    if (!payload) return undefined;

    if (typeof payload === 'string') {
      return payload;
    }

    if (typeof payload !== 'object') {
      return String(payload);
    }

    if ('error' in payload) {
      return this.extractErrorMessage((payload as { error?: unknown }).error);
    }

    if ('msg' in payload) {
      return this.extractErrorMessage((payload as { msg?: unknown }).msg);
    }

    if ('message' in payload) {
      return this.extractErrorMessage((payload as { message?: unknown }).message);
    }

    const i18nPayload = payload as {
      en?: unknown;
      'zh-CN'?: unknown;
      'zh-Hant'?: unknown;
    };

    if (typeof i18nPayload['zh-CN'] === 'string') return i18nPayload['zh-CN'];
    if (typeof i18nPayload.en === 'string') return i18nPayload.en;
    if (typeof i18nPayload['zh-Hant'] === 'string') return i18nPayload['zh-Hant'];

    try {
      return JSON.stringify(payload);
    } catch {
      return undefined;
    }
  }
}
