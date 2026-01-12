import { z } from 'zod';
import { renderTemplate } from './renderTemplate';

export const InputType = z.object({
  baseUrl: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().default('https://api.memmachine.ai/v2')
  ),
  apiKey: z.string().nonempty(),
  orgId: z.string().optional(),
  projectId: z.string().optional(),
  types: z.array(z.string()).default(['episodic', 'semantic']),
  query: z.string().nonempty(),
  limit: z.number().default(10),
  filter: z.string().default(''),
  contextTemplate: z.string().default('')
});

export const OutputType = z.object({
  memoryContext: z.string()
});

export async function tool({
  baseUrl,
  apiKey,
  orgId,
  projectId,
  types,
  query,
  limit,
  filter,
  contextTemplate
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  // 请求数据
  const response = await fetch(`${baseUrl}/memories/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      org_id: orgId,
      project_id: projectId,
      types,
      top_k: limit,
      query,
      filter
    })
  });

  if (!response.ok) {
    return Promise.reject({
      error: `MemMachine API Error: ${response.status} ${response.statusText}`
    });
  }

  const data = await response.json();
  return {
    memoryContext: renderTemplate(contextTemplate, data?.content || {})
  };
}
