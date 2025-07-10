import type { SystemVarType } from '@tool/type/tool';
import {
  StreamDataAnswerTypeEnum,
  StreamMessageTypeEnum,
  type StreamMessageType
} from '@tool/type/stream';

export async function runToolStream({
  baseUrl,
  authtoken,
  toolId,
  inputs,
  systemVar,
  onStreamData
}: {
  baseUrl: string;
  authtoken: string;
  toolId: string;
  inputs: Record<string, any>;
  systemVar: SystemVarType;
  onStreamData: (type: StreamDataAnswerTypeEnum, data: any) => void;
}) {
  const response = await fetch(`${baseUrl}/tool/runstream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authtoken
    },
    body: JSON.stringify({
      toolId,
      inputs,
      systemVar
    })
  });

  if (!response.ok) {
    return Promise.reject(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return Promise.reject('No response body reader');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value } = await reader.read();

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        try {
          const data = JSON.parse(trimmedLine) as StreamMessageType;

          if (data.type === StreamMessageTypeEnum.DATA) {
            if ('content' in data.data) {
              // streamed data
              onStreamData(data.data.type, data.data.content);
            } else {
              // unstreamed data
              return data.data;
            }
          }
          if (data.type === StreamMessageTypeEnum.ERROR) {
            return Promise.reject(data.error);
          }
        } catch (parseError) {
          continue;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
