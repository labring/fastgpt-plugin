import type { CoworkerdWorkerLimitsType } from '@domain/entities/plugin-coworkerd.entity';
import type { I18nStringType } from '@domain/value-objects/i18n-string.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';

import type {
  CoworkerdApiErrorResponse,
  CoworkerdRoute,
  CoworkerdStatusResponse,
  CoworkerdTenantResponse,
  CoworkerdVersionUploadResponse,
  CoworkerdWorkerResponse
} from './types';

export type {
  CoworkerdApiErrorResponse,
  CoworkerdRoute,
  CoworkerdStatusResponse,
  CoworkerdTenantResponse,
  CoworkerdVersionUploadResponse,
  CoworkerdWorkerResponse
} from './types';

export type CoworkerdApiClientDeps = {
  apiServerUrl: string;
  managementToken: string;
  fetch?: typeof fetch;
  requestTimeoutMs?: number;
  signal?: AbortSignal;
};

export class CoworkerdApiClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly customFetch: typeof fetch;

  constructor(private readonly deps: CoworkerdApiClientDeps) {
    this.baseUrl = deps.apiServerUrl.replace(/\/+$/, '');
    this.token = deps.managementToken;
    this.customFetch = deps.fetch ?? globalThis.fetch;
  }

  async getStatus(): Promise<Result<CoworkerdStatusResponse>> {
    return this.request<CoworkerdStatusResponse>({
      path: '/v1/status',
      method: 'GET',
      failureReason: {
        en: 'Failed to get coworkerd cluster status',
        'zh-CN': '获取 coworkerd 集群状态失败'
      }
    });
  }

  async getWorker(tenantId: string, workerId: string): Promise<Result<CoworkerdWorkerResponse>> {
    return this.request({
      path: `/v1/tenants/${encodeURIComponent(tenantId)}/workers/${encodeURIComponent(workerId)}`,
      method: 'GET',
      failureReason: { en: 'Failed to get coworkerd Worker', 'zh-CN': '获取 coworkerd Worker 失败' }
    });
  }

  async getTenant(tenantId: string): Promise<Result<CoworkerdTenantResponse>> {
    return this.request<CoworkerdTenantResponse>({
      path: `/v1/tenants/${encodeURIComponent(tenantId)}`,
      method: 'GET',
      failureReason: {
        en: `Failed to get tenant ${tenantId}`,
        'zh-CN': `获取租户 ${tenantId} 失败`
      }
    });
  }

  async ensureTenant(tenantId: string): Promise<Result<CoworkerdTenantResponse | undefined>> {
    const [tenant, tenantErr] = await this.getTenant(tenantId);
    if (tenant) {
      return successResult(tenant);
    }

    const isNotFound =
      tenantErr?.code === 'NOT_FOUND' ||
      (tenantErr?.data as { status?: number } | undefined)?.status === 404;

    if (isNotFound) {
      const [created, createErr] = await this.request<CoworkerdTenantResponse>({
        path: '/v1/tenants',
        method: 'POST',
        body: JSON.stringify({ name: tenantId }),
        headers: {
          'Content-Type': 'application/json'
        },
        failureReason: {
          en: `Failed to create tenant ${tenantId}`,
          'zh-CN': `创建租户 ${tenantId} 失败`
        }
      });

      if (createErr) {
        const isConflict =
          createErr.code === 'CONFLICT' ||
          (createErr.data as { status?: number } | undefined)?.status === 409;
        if (isConflict) {
          return successResult(undefined);
        }
        return failureResult(createErr);
      }

      return successResult(created);
    }

    return failureResult(tenantErr!);
  }

  async setTenantDefaultLimits(
    tenantId: string,
    defaultLimits: CoworkerdWorkerLimitsType
  ): Promise<Result<void>> {
    const path = `/v1/tenants/${encodeURIComponent(tenantId)}`;

    const [, err] = await this.request<unknown>({
      path,
      method: 'PATCH',
      body: JSON.stringify({ defaultLimits }),
      headers: {
        'Content-Type': 'application/json'
      },
      failureReason: {
        en: `Failed to update default limits for tenant ${tenantId}`,
        'zh-CN': `更新租户 ${tenantId} 的默认资源限制失败`
      }
    });

    if (err) return failureResult(err);
    return successResult(undefined);
  }

  async uploadVersion(arg: {
    tenantId: string;
    workerId: string;
    versionId: string;
    bundle: Uint8Array | Buffer | ArrayBuffer | Blob;
    activate?: boolean;
  }): Promise<Result<CoworkerdVersionUploadResponse>> {
    const activateQuery = arg.activate ? '?activate=true' : '';
    const path = `/v1/tenants/${encodeURIComponent(arg.tenantId)}/workers/${encodeURIComponent(
      arg.workerId
    )}/versions/${encodeURIComponent(arg.versionId)}${activateQuery}`;

    const [data, err] = await this.request<CoworkerdVersionUploadResponse>({
      path,
      method: 'PUT',
      body: arg.bundle as BodyInit,
      headers: {
        'Content-Type': 'application/x-tar'
      },
      failureReason: {
        en: `Failed to upload version ${arg.versionId} for worker ${arg.workerId}`,
        'zh-CN': `上传 Worker ${arg.workerId} 的版本 ${arg.versionId} 失败`
      }
    });

    if (err) return failureResult(err);
    return successResult(
      data ?? {
        versionId: arg.versionId,
        active: Boolean(arg.activate)
      }
    );
  }

  async activateVersion(
    tenantId: string,
    workerId: string,
    versionId: string
  ): Promise<Result<void>> {
    const path = `/v1/tenants/${encodeURIComponent(tenantId)}/workers/${encodeURIComponent(
      workerId
    )}/versions/${encodeURIComponent(versionId)}:activate`;

    const [, err] = await this.request<unknown>({
      path,
      method: 'POST',
      failureReason: {
        en: `Failed to activate version ${versionId} for worker ${workerId}`,
        'zh-CN': `激活 Worker ${workerId} 的版本 ${versionId} 失败`
      }
    });

    if (err) return failureResult(err);
    return successResult(undefined);
  }

  async deleteVersion(tenantId: string, workerId: string, versionId: string): Promise<Result<void>> {
    const path = `/v1/tenants/${encodeURIComponent(tenantId)}/workers/${encodeURIComponent(workerId)}/versions/${encodeURIComponent(versionId)}`;
    const [, err] = await this.request<unknown>({
      path,
      method: 'DELETE',
      failureReason: {
        en: `Failed to delete version ${versionId} for worker ${workerId}`,
        'zh-CN': `删除 Worker ${workerId} 的版本 ${versionId} 失败`
      }
    });
    if (err) return failureResult(err);
    return successResult(undefined);
  }

  async deleteWorker(tenantId: string, workerId: string): Promise<Result<void>> {
    const path = `/v1/tenants/${encodeURIComponent(tenantId)}/workers/${encodeURIComponent(
      workerId
    )}`;

    const [, err] = await this.request<unknown>({
      path,
      method: 'DELETE',
      failureReason: {
        en: `Failed to delete worker ${workerId}`,
        'zh-CN': `删除 Worker ${workerId} 失败`
      }
    });

    if (err) return failureResult(err);
    return successResult(undefined);
  }

  async setWorkerLimits(
    tenantId: string,
    workerId: string,
    limits: CoworkerdWorkerLimitsType
  ): Promise<Result<void>> {
    const path = `/v1/tenants/${encodeURIComponent(tenantId)}/workers/${encodeURIComponent(
      workerId
    )}`;

    const [, err] = await this.request<unknown>({
      path,
      method: 'PATCH',
      body: JSON.stringify({ limits }),
      headers: {
        'Content-Type': 'application/json'
      },
      failureReason: {
        en: `Failed to update limits for worker ${workerId}`,
        'zh-CN': `更新 Worker ${workerId} 的资源限制失败`
      }
    });

    if (err) return failureResult(err);
    return successResult(undefined);
  }

  async setWorkerRoutes(
    tenantId: string,
    workerId: string,
    routes: CoworkerdRoute[]
  ): Promise<Result<void>> {
    const path = `/v1/tenants/${encodeURIComponent(tenantId)}/workers/${encodeURIComponent(
      workerId
    )}/routes`;

    const [, err] = await this.request<unknown>({
      path,
      method: 'PUT',
      body: JSON.stringify({ routes }),
      headers: {
        'Content-Type': 'application/json'
      },
      failureReason: {
        en: `Failed to update routes for worker ${workerId}`,
        'zh-CN': `更新 Worker ${workerId} 的路由配置失败`
      }
    });

    if (err) return failureResult(err);
    return successResult(undefined);
  }

  private async request<T = unknown>(options: {
    path: string;
    method: string;
    body?: BodyInit;
    headers?: Record<string, string>;
    failureReason: I18nStringType;
  }): Promise<Result<T>> {
    const url = `${this.baseUrl}${options.path}`;
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${this.token}`);

    let response: Response;
    try {
      if (this.deps.signal?.aborted) throw this.deps.signal.reason;
      const signal = this.deps.signal
        ? AbortSignal.any([this.deps.signal, AbortSignal.timeout(this.deps.requestTimeoutMs ?? 30_000)])
        : AbortSignal.timeout(this.deps.requestTimeoutMs ?? 30_000);
      response = await this.customFetch(url, {
        method: options.method,
        body: options.body,
        headers,
        signal,
        redirect: 'error'
      });
    } catch (networkError) {
      return failureResult({
        reason: options.failureReason,
        code: 'NETWORK_ERROR',
        message:
          networkError instanceof Error
            ? networkError.message
            : 'Network error calling coworkerd api',
        error:
          networkError instanceof Error
            ? networkError
            : new Error('Network error calling coworkerd api'),
        data: { url, method: options.method }
      });
    }

    if (!response.ok) {
      const errorData = await this.readErrorPayload(response);
      return failureResult({
        reason: {
          en: errorData.reason || options.failureReason.en,
          'zh-CN': errorData.reason || options.failureReason['zh-CN']
        },
        code: errorData.code,
        message: errorData.reason,
        error: new Error(`[CoworkerdApiError ${errorData.code}] ${errorData.reason}`),
        data: {
          status: response.status,
          code: errorData.code,
          reason: errorData.reason
        }
      });
    }

    if (response.status === 204) {
      return successResult(undefined as T);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return successResult(undefined as T);
    }

    try {
      const payload = (await response.json()) as T;
      return successResult(payload);
    } catch (jsonErr) {
      return failureResult({
        reason: options.failureReason,
        code: 'INVALID_JSON_RESPONSE',
        message: 'Failed to parse JSON response from coworkerd apiserver',
        error: jsonErr instanceof Error ? jsonErr : new Error('Invalid JSON response'),
        data: { status: response.status }
      });
    }
  }

  private async readErrorPayload(response: Response): Promise<CoworkerdApiErrorResponse> {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      try {
        const json = (await response.json()) as Partial<CoworkerdApiErrorResponse>;
        return {
          code: json.code ?? `HTTP_${response.status}`,
          reason: json.reason ?? response.statusText
        };
      } catch {
        // Fall back below
      }
    }

    try {
      const text = await response.text();
      return {
        code: `HTTP_${response.status}`,
        reason: text || response.statusText
      };
    } catch {
      return {
        code: `HTTP_${response.status}`,
        reason: response.statusText
      };
    }
  }
}
