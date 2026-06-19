import { z } from 'zod';
import { createDataForB2BClient, handleDataForB2BError } from '../../../client';
import type { TypeaheadResponse } from '../../../types';

export const InputType = z.object({
  apiKey: z.string().min(1, 'DataForB2B API key is required'),
  type: z.string().min(1, "'type' is required"),
  q: z.string().min(1, "'q' (query) is required"),
  limit: z.number().int().min(1).max(20).default(20)
});

export const OutputType = z.object({
  values: z.array(z.string()).default([]),
  results: z.array(z.record(z.string(), z.any())).default([])
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    const { apiKey, type, q } = props;
    const limit = Math.max(1, Math.min(props.limit ?? 20, 20));

    const client = createDataForB2BClient(apiKey);
    const response = await client.get<TypeaheadResponse>('/typeahead', {
      params: { type, q, limit }
    });
    const results = response.data.results || [];
    const values = results
      .map((r) => r.value)
      .filter((v): v is string => typeof v === 'string' && v.length > 0);

    return { values, results };
  } catch (error) {
    return Promise.reject(handleDataForB2BError(error));
  }
}
