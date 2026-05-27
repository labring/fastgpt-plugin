import type { InvokeOptions } from '../types';

import { createServiceRequest } from './request';
import type { ServiceRequest, ServiceRequestInput } from './types';

const DEFAULT_QUEUE_TIMEOUT_MS = 30_000;

export interface RequestQueueOptions {
  maxSize: () => number;
  timeoutMs: () => number;
  onTimeout: (request: ServiceRequest, error: Error) => void;
}

export class RequestQueue {
  private requests: ServiceRequest[] = [];

  constructor(private readonly options: RequestQueueOptions) {}

  get length(): number {
    return this.requests.length;
  }

  enqueue(input: ServiceRequestInput): Promise<unknown> {
    if (this.requests.length >= this.options.maxSize()) {
      throw new Error('Queue is full');
    }

    const { request, promise } = createServiceRequest({
      ...input,
      queuedAt: Date.now()
    });

    this.armTimeout(request);
    this.insertByPriority(request);
    return promise;
  }

  shift(): ServiceRequest | undefined {
    const request = this.requests.shift();
    if (request?.timeout) {
      clearTimeout(request.timeout);
      request.timeout = undefined;
    }
    return request;
  }

  drain(): ServiceRequest[] {
    const requests = this.requests.splice(0);
    for (const request of requests) {
      if (request.timeout) {
        clearTimeout(request.timeout);
        request.timeout = undefined;
      }
    }
    return requests;
  }

  append(request: ServiceRequest): void {
    if (this.requests.length >= this.options.maxSize()) {
      throw new Error('Queue is full');
    }

    this.armTimeout(request);
    this.insertByPriority(request);
  }

  rejectAll(error: Error, onReject?: (request: ServiceRequest) => void): void {
    while (this.requests.length > 0) {
      const request = this.shift();
      if (!request) {
        break;
      }

      onReject?.(request);
      request.reject(error);
    }
  }

  private insertByPriority(request: ServiceRequest): void {
    const priority = getPriority(request.options);
    let insertIndex = this.requests.length;

    // 高 priority 插到更靠前的位置；相同 priority 保持 FIFO，避免同级请求乱序。
    for (let i = 0; i < this.requests.length; i++) {
      if (priority > getPriority(this.requests[i].options)) {
        insertIndex = i;
        break;
      }
    }

    this.requests.splice(insertIndex, 0, request);
  }

  private remove(requestId: string): boolean {
    const index = this.requests.findIndex((request) => request.requestId === requestId);
    if (index < 0) {
      return false;
    }

    const [request] = this.requests.splice(index, 1);
    if (request?.timeout) {
      clearTimeout(request.timeout);
      request.timeout = undefined;
    }
    return true;
  }

  private armTimeout(request: ServiceRequest): void {
    // 队列超时只覆盖等待阶段；请求被派发给 Pod 时 shift() 会清掉这个计时器。
    const timeoutMs = this.getQueueTimeoutMs();
    const queuedAt = request.queuedAt ?? Date.now();
    const elapsedMs = Date.now() - queuedAt;
    const remainingMs = Math.max(1, timeoutMs - elapsedMs);
    request.timeout = setTimeout(() => {
      if (!this.remove(request.requestId)) {
        return;
      }

      const error = new Error('Queue wait timeout');
      this.options.onTimeout(request, error);
      request.reject(error);
    }, remainingMs);
  }

  private getQueueTimeoutMs(): number {
    const timeoutMs = this.options.timeoutMs();
    return timeoutMs > 0 ? timeoutMs : DEFAULT_QUEUE_TIMEOUT_MS;
  }
}

function getPriority(options?: InvokeOptions): number {
  return options?.priority ?? 0;
}
