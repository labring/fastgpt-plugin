import { z } from 'zod';

const HOL_REGISTRY_BASE = 'https://hol.org/registry/api/v1';

export const InputType = z.object({
  uaid: z.string()
});

export const OutputType = z.object({
  similarAgents: z.array(
    z.object({
      uaid: z.string(),
      name: z.string(),
      description: z.string().optional(),
      trustScore: z.number().optional()
    })
  )
});

function formatUaid(uaid: string): string {
  return uaid.startsWith('uaid:') ? uaid : `uaid:${uaid}`;
}

interface SimilarHit {
  uaid: string;
  name?: string;
  description?: string;
  trustScore?: number;
}

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { uaid } = props;
  const url = `${HOL_REGISTRY_BASE}/agents/${encodeURIComponent(formatUaid(uaid))}/similar`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'HOL-FastGPT-Plugin/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json() as { similar?: SimilarHit[]; hits?: SimilarHit[] };
  const similar = data.similar || data.hits || [];

  return {
    similarAgents: similar.map((agent) => ({
      uaid: agent.uaid,
      name: agent.name || '',
      description: (agent.description || '').slice(0, 500),
      trustScore: agent.trustScore
    }))
  };
}
