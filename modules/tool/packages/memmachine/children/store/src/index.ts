import { getErrText } from '@tool/utils/err';
import { z } from 'zod';

export const InputType = z.object({
  baseUrl: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().default('https://api.memmachine.ai/v2')
  ),
  apiKey: z.string().nonempty(),
  orgId: z.string().optional(),
  projectId: z.string().optional(),
  types: z.array(z.string()).default(['episodic', 'semantic']),
  content: z.string().nonempty(),
  producer: z.string().optional(),
  producedFor: z.string().optional(),
  timestamp: z.string().optional(),
  role: z.string().optional(),
  metadata: z.string().optional()
});

export const OutputType = z.object({
  memoryId: z.string()
});

export async function tool({
  baseUrl,
  apiKey,
  orgId,
  projectId,
  types,
  content,
  producer,
  producedFor,
  timestamp,
  role,
  metadata
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  let metadataObj: Record<string, any> | undefined;
  if (metadata) {
    try {
      metadataObj = JSON.parse(metadata);
    } catch (e) {
      return Promise.reject({ error: `Invalid JSON format for metadata: ${getErrText(e)}` });
    }
  }

  let timestampISO: string | undefined;
  if (timestamp) {
    try {
      timestampISO = new Date(timestamp).toISOString();
    } catch (e) {
      return Promise.reject({ error: `Invalid format for timestamp: ${getErrText(e)}` });
    }
  }

  // 请求数据
  const response = await fetch(`${baseUrl}/memories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      org_id: orgId,
      project_id: projectId,
      types,
      messages: [
        {
          content,
          producer,
          produced_for: producedFor,
          timestamp: timestampISO || new Date().toISOString(),
          role,
          metadata: metadataObj || {}
        }
      ]
    })
  });

  if (!response.ok) {
    return Promise.reject({
      error: `MemMachine API Error: ${response.status} ${response.statusText}`
    });
  }

  const data = await response.json();
  return {
    memoryId: data?.results?.[0]?.uid ?? ''
  };
}
