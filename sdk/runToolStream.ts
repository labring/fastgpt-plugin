import type { SystemVarType } from '@tool/type/tool';

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
  onStreamData: (data: { type: string; data: any }) => void;
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
  let finalResult: any = null;

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
          onStreamData(data);

          if (data.type === 'success' && data.data?.output) {
            finalResult = data.data.output;
          } else if (data.type === 'error') {
            return Promise.reject(data.data?.message || 'Stream error');
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
