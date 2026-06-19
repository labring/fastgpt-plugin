import { z } from 'zod';
import { createDataForB2BClient, handleDataForB2BError } from '../../../client';
import type { EnrichCompanyRequest } from '../../../types';

export const InputType = z.object({
  apiKey: z.string().min(1, 'DataForB2B API key is required'),
  company_identifier: z.string().min(1, "'company_identifier' is required")
});

export const OutputType = z.object({
  result: z.record(z.string(), z.any()).default({})
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    const { apiKey, company_identifier } = props;
    const body: EnrichCompanyRequest = { company_identifier };

    const client = createDataForB2BClient(apiKey);
    const response = await client.post<Record<string, unknown>>('/enrich/company', body);

    return { result: response.data || {} };
  } catch (error) {
    return Promise.reject(handleDataForB2BError(error));
  }
}
