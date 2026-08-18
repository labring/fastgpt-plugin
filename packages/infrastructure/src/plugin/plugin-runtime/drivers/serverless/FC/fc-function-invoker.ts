import { randomUUID } from 'node:crypto';

import { StreamData } from '@domain/value-objects/stream.vo';
import type { ToolStreamMessageType } from '@domain/value-objects/tool.vo';

import type {
  FCFunctionInvokeInput,
  FCFunctionProvider,
  FCInvocationModeType,
  FCInvokeFrame
} from './types';
import { FCRuntimeError } from './types';

export type FCFunctionInvokerDeps = {
  provider: FCFunctionProvider;
};

export class FCFunctionInvoker {
  constructor(private readonly deps: FCFunctionInvokerDeps) {}

  async invoke<P, R, S extends boolean>({
    functionName,
    runtimeId,
    eventName,
    payload,
    returnStream,
    timeoutMs,
    invocationMode,
    invocationId
  }: {
    functionName: string;
    runtimeId: string;
    eventName: FCFunctionInvokeInput<P>['eventName'];
    payload: P;
    returnStream: S;
    timeoutMs: number;
    invocationMode: FCInvocationModeType;
    invocationId?: string;
  }): Promise<S extends true ? StreamData<R> : R> {
    const result = await this.invokeProvider<P, R>({
      functionName,
      runtimeId,
      eventName,
      payload,
      returnStream,
      timeoutMs,
      invocationMode,
      invocationId: invocationId ?? randomUUID()
    });

    if (returnStream) {
      const stream = StreamData.create<ToolStreamMessageType>((output) => {
        for (const frame of result.frames ?? []) {
          this.writeFrame(output, frame);
        }
        output.close();
      });

      return stream as S extends true ? StreamData<R> : R;
    }

    if (result.response !== undefined) {
      return result.response as S extends true ? StreamData<R> : R;
    }

    const responseFrame = (result.frames ?? []).find((frame) => frame.type === 'response');
    if (responseFrame?.type === 'response') {
      return responseFrame.data as S extends true ? StreamData<R> : R;
    }

    const errorFrame = (result.frames ?? []).find((frame) => frame.type === 'error');
    if (errorFrame?.type === 'error') {
      throw new FCRuntimeError('FC_HANDLER_ERROR', normalizeFrameError(errorFrame.data));
    }

    throw new FCRuntimeError('FC_STREAM_PROTOCOL_ERROR', 'FC response did not include result');
  }

  private async invokeProvider<P, R>(input: FCFunctionInvokeInput<P>) {
    try {
      return await this.deps.provider.invoke<P, R>(input);
    } catch (error) {
      throw mapInvokeError(error);
    }
  }

  private writeFrame(output: StreamData<ToolStreamMessageType>, frame: FCInvokeFrame): void {
    switch (frame.type) {
      case 'stream': {
        output.send({
          type: 'stream',
          data: frame.data as ToolStreamMessageType['data']
        } as ToolStreamMessageType);
        return;
      }
      case 'response': {
        output.send({
          type: 'response',
          data: frame.data as Record<string, unknown>
        });
        return;
      }
      case 'error': {
        output.send({
          type: 'error',
          data: normalizeFrameError(frame.data)
        });
        return;
      }
    }
  }
}

export function parseFCInvokeFrames(text: string): FCInvokeFrame[] {
  const frames: FCInvokeFrame[] = [];

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const normalized = trimmed.startsWith('data:') ? trimmed.slice('data:'.length).trim() : trimmed;
    try {
      const frame = JSON.parse(normalized) as FCInvokeFrame;
      if (!frame || !['stream', 'response', 'error'].includes(frame.type)) {
        throw new Error('Unknown FC frame type');
      }
      frames.push(frame);
    } catch (error) {
      throw new FCRuntimeError('FC_STREAM_PROTOCOL_ERROR', 'Invalid FC stream frame', error);
    }
  }

  return frames;
}

function normalizeFrameError(data: FCInvokeFrame['data']): string {
  if (typeof data === 'string') {
    return data;
  }
  if (data && typeof data === 'object' && 'message' in data) {
    return String((data as { message?: unknown }).message ?? 'FC handler error');
  }
  return 'FC handler error';
}

function mapInvokeError(error: unknown): FCRuntimeError {
  if (error instanceof FCRuntimeError) {
    return error;
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return new FCRuntimeError('FC_INVOKE_TIMEOUT', 'FC invoke timeout', error);
  }
  if (error instanceof Error && /401|403|unauthor/i.test(error.message)) {
    return new FCRuntimeError('FC_INVOKE_UNAUTHORIZED', 'FC invoke unauthorized', error);
  }
  return new FCRuntimeError('FC_INVOKE_NETWORK_ERROR', 'FC invoke failed', error);
}
