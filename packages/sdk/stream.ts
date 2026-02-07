import {
  type StreamMessageType,
  type StreamDataType,
  type SystemVarType
} from '@fastgpt-plugin/helpers/tools/schemas/req';
import { type ToolHandlerReturnType } from '@fastgpt-plugin/helpers/tools/schemas/req';
import { EventStreamContentType, fetchEventSource } from '@fortaine/fetch-event-source';

type RunStreamParams = {
  toolId: string;
  inputs: Record<string, any>;
  systemVar: SystemVarType;
  onMessage: (e: StreamDataType) => void;
};

export class RunToolWithStream {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string
  ) {}

  async run(params: RunStreamParams): Promise<ToolHandlerReturnType> {
    const controller = new AbortController();

    return new Promise<ToolHandlerReturnType>((resolve, reject) => {
      let settled = false;

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        controller.abort();
        fn();
      };

      fetchEventSource(`${this.baseUrl}/api/tools/run-stream`, {
        method: 'POST',
        signal: controller.signal,
        openWhenHidden: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
        },
        body: JSON.stringify({
          toolId: params.toolId,
          inputs: params.inputs,
          systemVar: params.systemVar
        }),

        onopen: async (res) => {
          await this.assertStreamResponse(res);
        },

        onmessage: (msg) => {
          const parsed = this.safeParseMessage(msg.data);
          if (!parsed) return;

          if (this.isStreamMessage(parsed)) {
            params.onMessage(parsed.data);
          } else if (this.isResponseMessage(parsed)) {
            settle(() => resolve(parsed.data));
          } else if (this.isErrorMessage(parsed)) {
            settle(() => reject(parsed.data));
          }
        },

        onerror: (err) => {
          settle(() => reject(err));
          throw err;
        },

        onclose: () => {
          settle(() => reject(new Error('SSE closed without terminal event')));
        }
      });
    });
  }

  private async assertStreamResponse(res: Response) {
    const contentType = res.headers.get('content-type') ?? '';

    if (!res.ok) {
      throw new Error(await this.readError(res));
    }

    if (!contentType.startsWith(EventStreamContentType)) {
      throw new Error(await this.readError(res));
    }
  }

  private async readError(res: Response): Promise<string> {
    try {
      const json = await res.clone().json();
      return JSON.stringify(json);
    } catch {
      const text = await res.clone().text();
      return text || `HTTP ${res.status} ${res.statusText}`;
    }
  }

  private safeParseMessage(data: string): StreamMessageType | null {
    try {
      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed !== 'object' || !parsed.type) {
        return null;
      }
      // 使用类型断言来明确返回类型
      const message = parsed as StreamMessageType;
      return message;
    } catch {
      return null;
    }
  }

  private isStreamMessage(msg: StreamMessageType): msg is { type: 'stream'; data: StreamDataType } {
    return msg.type === 'stream';
  }

  private isResponseMessage(
    msg: StreamMessageType
  ): msg is { type: 'response'; data: ToolHandlerReturnType } {
    return msg.type === 'response';
  }

  private isErrorMessage(msg: StreamMessageType): msg is { type: 'error'; data: string } {
    return msg.type === 'error';
  }
}
