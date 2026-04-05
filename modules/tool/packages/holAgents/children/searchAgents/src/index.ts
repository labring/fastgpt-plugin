import { z } from 'zod';

const HOL_REGISTRY_BASE = 'https://hol.org/registry/api/v1';

export const InputType = z.object({
  query: z.string(),
  limit: z.number().min(1).max(50).default(10)
});

export const OutputType = z.object({
  total: z.number(),
  agents: z.array(
    z.object({
      uaid: z.string(),
      name: z.string(),
      description: z.string(),
      trustScore: z.number().optional(),
      capabilities: z.array(z.string()).optional(),
      protocols: z.array(z.string()).optional()
    })
  )
});

interface Hit {
  uaid: string;
  name?: string;
  description?: string;
  trustScore?: number;
  capabilities?: string[];
  protocols?: string[];
}

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { query, limit } = props;
  const url = `${HOL_REGISTRY_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'HOL-FastGPT-Plugin/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json() as { total?: number; hits?: Hit[] };
  const hits = data.hits || [];

  return {
    total: data.total || hits.length,
    agents: hits.map((hit) => ({
      uaid: hit.uaid,
      name: hit.name || '',
      description: (hit.description || '').slice(0, 500),
      trustScore: hit.trustScore,
      capabilities: hit.capabilities,
      protocols: hit.protocols
    }))
  };
}
