import { z } from 'zod';
import { createDataForB2BClient, handleDataForB2BError, buildFilters } from '../../../client';
import type { SearchRequest, SearchResponse } from '../../../types';

const slotShape = {
  filter_1_column: z.string().optional(),
  filter_1_operator: z.string().optional(),
  filter_1_value: z.string().optional(),
  filter_2_column: z.string().optional(),
  filter_2_operator: z.string().optional(),
  filter_2_value: z.string().optional(),
  filter_3_column: z.string().optional(),
  filter_3_operator: z.string().optional(),
  filter_3_value: z.string().optional(),
  filter_4_column: z.string().optional(),
  filter_4_operator: z.string().optional(),
  filter_4_value: z.string().optional(),
  filter_5_column: z.string().optional(),
  filter_5_operator: z.string().optional(),
  filter_5_value: z.string().optional()
};

export const InputType = z.object({
  apiKey: z.string().min(1, 'DataForB2B API key is required'),
  match: z.enum(['and', 'or']).default('and'),
  ...slotShape,
  advanced_filters: z.string().optional(),
  count: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).default(0),
  enrich_live: z.boolean().default(false)
});

export const OutputType = z.object({
  total: z.number().default(0),
  count: z.number().default(0),
  results: z.array(z.record(z.string(), z.any())).default([])
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    const { apiKey, count, offset, enrich_live } = props;

    const filters = buildFilters(props as Record<string, unknown>, 5);
    if (!filters) {
      return Promise.reject(
        'Provide at least one filter slot (column + value) or advanced_filters.'
      );
    }

    const client = createDataForB2BClient(apiKey);
    const body: SearchRequest = { filters, count, offset, enrich_live };
    const response = await client.post<SearchResponse>('/search/people', body);
    const data = response.data;
    const results = data.results || [];

    return {
      total: data.total ?? 0,
      count: data.count ?? results.length,
      results
    };
  } catch (error) {
    return Promise.reject(handleDataForB2BError(error));
  }
}
