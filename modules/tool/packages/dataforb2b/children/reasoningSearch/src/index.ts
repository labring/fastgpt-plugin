import { z } from 'zod';
import { createDataForB2BClient, handleDataForB2BError, parseJsonParam } from '../../../client';
import type { ReasoningRequest, ReasoningResponse } from '../../../types';

export const InputType = z.object({
  apiKey: z.string().min(1, 'DataForB2B API key is required'),
  query: z.string().optional(),
  category: z.enum(['people', 'companies']).default('people'),
  session_id: z.string().optional(),
  answers: z.string().optional(),
  max_results: z.number().int().min(1).max(100).default(25),
  enrich_live: z.boolean().default(false)
});

export const OutputType = z.object({
  status: z.string().optional(),
  session_id: z.string().optional(),
  questions: z.array(z.record(z.string(), z.any())).default([]),
  total: z.number().default(0),
  results: z.array(z.record(z.string(), z.any())).default([])
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    const { apiKey, query, category, session_id, max_results, enrich_live } = props;
    const answers = parseJsonParam(props.answers, 'answers') as Record<string, unknown> | undefined;

    if (!query && !(session_id && answers)) {
      return Promise.reject(
        "Provide 'query' (first call) or 'session_id' + 'answers' (to resolve a needs_input turn)."
      );
    }

    const body: ReasoningRequest = { category, max_results, enrich_live };
    if (query) body.query = query;
    if (session_id) body.session_id = session_id;
    if (answers) body.answers = answers;

    const client = createDataForB2BClient(apiKey);
    const response = await client.post<ReasoningResponse>('/search/reasoning', body);
    const data = response.data;

    return {
      status: data.status,
      session_id: data.session_id,
      questions: data.questions || [],
      total: data.total ?? 0,
      results: data.results || []
    };
  } catch (error) {
    return Promise.reject(handleDataForB2BError(error));
  }
}
