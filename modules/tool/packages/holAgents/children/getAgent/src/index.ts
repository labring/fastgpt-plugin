import { z } from 'zod';

const HOL_REGISTRY_BASE = 'https://hol.org/registry/api/v1';

export const InputType = z.object({
  uaid: z.string()
});

export const OutputType = z.object({
  agent: z.object({
    uaid: z.string(),
    name: z.string(),
    description: z.string().optional(),
    trustScore: z.number().optional(),
    capabilities: z.array(z.string()).optional(),
    capabilityLabels: z.array(z.string()).optional(),
    protocols: z.array(z.string()).optional(),
    endpoints: z.record(z.any()).optional(),
    registry: z.string().optional()
  })
});

function formatUaid(uaid: string): string {
  return uaid.startsWith('uaid:') ? uaid : `uaid:${uaid}`;
}

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { uaid } = props;
  const url = `${HOL_REGISTRY_BASE}/agents/${encodeURIComponent(formatUaid(uaid))}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'HOL-FastGPT-Plugin/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json() as Record<string, unknown>;

  return {
    agent: {
      uaid: (data.uaid as string) || '',
      name: (data.name as string) || '',
      description: data.description as string | undefined,
      trustScore: data.trustScore as number | undefined,
      capabilities: data.capabilities as string[] | undefined,
      capabilityLabels: data.capabilityLabels as string[] | undefined,
      protocols: data.protocols as string[] | undefined,
      endpoints: data.endpoints as Record<string, unknown> | undefined,
      registry: data.registry as string | undefined
    }
  };
}
