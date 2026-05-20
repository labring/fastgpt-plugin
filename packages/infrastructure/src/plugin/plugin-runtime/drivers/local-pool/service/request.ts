import { randomUUID } from 'node:crypto';

import type { CreatedServiceRequest, ServiceRequestInput } from './types';

export function createServiceRequest(input: ServiceRequestInput): CreatedServiceRequest {
  let resolve!: (value: unknown) => void;
  let reject!: (error: Error) => void;

  const promise = new Promise<unknown>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return {
    request: {
      requestId: randomUUID(),
      eventName: input.eventName,
      payload: input.payload,
      returnStream: input.returnStream,
      options: input.options,
      startedAt: input.startedAt ?? Date.now(),
      queuedAt: input.queuedAt,
      resolve,
      reject
    },
    promise
  };
}
