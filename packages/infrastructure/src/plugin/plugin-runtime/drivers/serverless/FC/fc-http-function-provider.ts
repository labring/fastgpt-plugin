import { randomUUID } from 'node:crypto';

import { FC_DEFAULT_HTTP_PATH, FC_REQUEST_PROTOCOL } from './constants';
import { parseFCInvokeFrames } from './fc-function-invoker';
import { signFCRequest } from './fc-request-signature';
import type {
  FCFunctionDefinition,
  FCFunctionEnsureResult,
  FCFunctionInvokeInput,
  FCFunctionInvokeResult,
  FCFunctionProvider,
  FCFunctionRecord
} from './types';

export type FCHttpFunctionProviderDeps = {
  httpBaseUrl: string;
  signingSecret: string;
  getFunctionUrl?: (functionName: string) => string;
};

export class FCHttpFunctionProvider implements FCFunctionProvider {
  private readonly functions = new Map<string, FCFunctionRecord>();

  constructor(private readonly deps: FCHttpFunctionProviderDeps) {}

  async getFunction(functionName: string): Promise<FCFunctionRecord | null> {
    return this.functions.get(functionName) ?? null;
  }

  async ensureFunction(definition: FCFunctionDefinition): Promise<FCFunctionEnsureResult> {
    const previous = this.functions.get(definition.functionName);
    const next: FCFunctionRecord = {
      ...definition,
      updatedAt: Date.now(),
      state: 'http-managed'
    };

    this.functions.set(definition.functionName, next);

    return {
      state: previous ? 'updated' : 'created',
      function: next
    };
  }

  async deleteFunction(functionName: string): Promise<void> {
    this.functions.delete(functionName);
  }

  async invoke<P = unknown, R = unknown>(
    input: FCFunctionInvokeInput<P>
  ): Promise<FCFunctionInvokeResult<R>> {
    const body = JSON.stringify({
      protocol: FC_REQUEST_PROTOCOL,
      invocationId: input.invocationId,
      eventName: input.eventName,
      returnStream: input.returnStream,
      payload: input.payload
    });
    const url = this.getInvokeUrl(input.functionName);
    const path = new URL(url).pathname || FC_DEFAULT_HTTP_PATH;
    const headers = signFCRequest(
      {
        method: 'POST',
        path,
        timestamp: Date.now(),
        invocationId: input.invocationId || randomUUID(),
        runtimeId: input.runtimeId,
        body
      },
      this.deps.signingSecret
    );

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), input.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body,
        headers: {
          ...headers,
          'content-type': 'application/json'
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`FC HTTP invoke failed: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      return {
        frames: parseFCInvokeFrames(text)
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private getInvokeUrl(functionName: string): string {
    if (this.deps.getFunctionUrl) {
      return this.deps.getFunctionUrl(functionName);
    }

    return new URL(`${functionName}${FC_DEFAULT_HTTP_PATH}`, ensureSlash(this.deps.httpBaseUrl))
      .toString()
      .replace(/\/$/, '');
  }
}

function ensureSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}
