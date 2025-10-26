import {
  StreamMessageTypeEnum,
  type StreamMessageType,
  type StreamDataType,
  type SystemVarType,
  type ToolCallbackReturnSchemaType
} from '@tool/type/req';
import {
  // refer to https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web
  EventStreamContentType,
  fetchEventSource
} from '@fortaine/fetch-event-source';

export class RunToolWithStream {
  private baseUrl: string;
  private token: string;

  constructor({ baseUrl, token }: { baseUrl: string; token: string }) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async run({
    toolId,
    inputs,
    systemVar,
    onMessage
  }: {
    toolId: string;
    inputs: Record<string, any>;
    systemVar: SystemVarType;
    onMessage: (e: StreamDataType) => void;
  }) {
    return new Promise<ToolCallbackReturnSchemaType>((resolve, reject) => {
      let done = false;
      const requestData = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authtoken: this.token
        },
        body: JSON.stringify({
          toolId,
          inputs,
          systemVar
        })
      };

      try {
        // send request
        fetchEventSource(`${this.baseUrl}/tool/runstream`, {
          ...requestData,
          async onopen(res) {
            const contentType = res.headers.get('content-type');

            // not stream
            if (contentType?.startsWith('text/plain')) {
              return reject(await res.clone().text());
            }

            // failed stream
            if (
              !res.ok ||
              !res.headers.get('content-type')?.startsWith(EventStreamContentType) ||
              res.status !== 200
            ) {
              try {
                return reject(await res.clone().json());
              } catch {
                const errText = await res.clone().text();
                if (!errText.startsWith('event: error')) {
                  return reject(errText);
                }
              }
            }
          },
          onmessage: ({ event, data }) => {
            // parse text to json
            const parseJson = (() => {
              try {
                return JSON.parse(data) as StreamMessageType;
              } catch (error) {
                return; // 解析失败，跳过这条消息
              }
            })();

            // 更严格的类型检查
            if (!parseJson || typeof parseJson !== 'object' || !parseJson.type) {
              return;
            }

            if (parseJson.type === StreamMessageTypeEnum.response) {
              done = true;
              return resolve(parseJson.data);
            } else if (parseJson.type === StreamMessageTypeEnum.error) {
              return reject(parseJson.data);
            } else if (parseJson.type === StreamMessageTypeEnum.stream) {
              onMessage(parseJson.data);
            }
          },
          onerror(err) {
            reject(err);
          },
          onclose() {
            if (!done) {
              reject('Stream closed but not result');
            }
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
