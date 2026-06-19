import { z } from 'zod';
import { createDataForB2BClient, handleDataForB2BError } from '../../../client';
import type { EnrichProfileRequest } from '../../../types';

export const InputType = z.object({
  apiKey: z.string().min(1, 'DataForB2B API key is required'),
  profile_identifier: z.string().min(1, "'profile_identifier' is required"),
  enrich_profile: z.boolean().default(true),
  enrich_work_email: z.boolean().default(false),
  enrich_personal_email: z.boolean().default(false),
  enrich_phone: z.boolean().default(false),
  enrich_github: z.boolean().default(false)
});

export const OutputType = z.object({
  result: z.record(z.string(), z.any()).default({})
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    const { apiKey, profile_identifier } = props;

    const body: EnrichProfileRequest = {
      profile_identifier,
      enrich_profile: props.enrich_profile,
      enrich_work_email: props.enrich_work_email,
      enrich_personal_email: props.enrich_personal_email,
      enrich_phone: props.enrich_phone,
      enrich_github: props.enrich_github
    };

    // The API requires at least one enrich_* flag — default to full profile.
    const anyFlag =
      body.enrich_profile ||
      body.enrich_work_email ||
      body.enrich_personal_email ||
      body.enrich_phone ||
      body.enrich_github;
    if (!anyFlag) body.enrich_profile = true;

    const client = createDataForB2BClient(apiKey);
    const response = await client.post<Record<string, unknown>>('/enrich/profile', body);

    return { result: response.data || {} };
  } catch (error) {
    return Promise.reject(handleDataForB2BError(error));
  }
}
