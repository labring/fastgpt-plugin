import type { SystemVarType } from '@tool/type/tool';
import { StreamDataAnswerType } from '@tool/type/stream';

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
  onStreamData: (type: StreamDataAnswerType, data: any) => void;
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
  const finalResult: any = null;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        return finalResult || {};
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        try {
          const data = JSON.parse(trimmedLine);
          onStreamData(data.type, data.content);
        } catch (parseError) {
          continue;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
