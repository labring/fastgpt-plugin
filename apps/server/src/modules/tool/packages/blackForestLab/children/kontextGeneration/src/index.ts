import { z } from 'zod';
import { delay } from '@tool/utils/delay';

const FluxStatus = z.enum(['Pending', 'Ready', 'Error', 'Failed']);

export const InputType = z.object({
  apiKey: z.string().describe('API key for accessing Black Forest Labs FLUX.1 service'),
  prompt: z.string().describe('Text prompt describing the image to generate'),
  aspect_ratio: z
    .enum(['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'])
    .describe('Aspect ratio of the generated image'),
  seed: z.number().optional().describe('Random seed for reproducible generation (optional)'),
  prompt_upsampling: z.boolean().describe('Enable prompt upsampling to enhance the input prompt'),
  safety_tolerance: z.coerce
    .number()
    .min(0)
    .max(6)
    .describe('Safety tolerance level (0-6, higher values are more permissive)'),
  output_format: z.enum(['jpeg', 'png']).describe('Output image format')
});

export const OutputType = z.object({
  image_url: z.string().describe('URL to access the generated image')
});

// API schemas
const GenerationRequestSchema = z.object({
  id: z.string(),
  polling_url: z.string().url()
});

const FluxResultSchema = z.object({
  status: FluxStatus,
  result: z
    .object({
      sample: z.string().url()
    })
    .nullable()
    .optional(),
  error: z.string().optional()
});

export async function tool(params: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    const requestBodySchema = InputType.omit({ apiKey: true });
    const requestBody = requestBodySchema.parse(params);

    const response = await fetch('https://api.bfl.ai/v1/flux-kontext-pro', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'x-key': params.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      return Promise.reject({
        error: `HTTP error! status: ${response.status}`
      });
    }

    const { polling_url } = GenerationRequestSchema.parse(await response.json());

    // polling result
    for (let attempts = 0; attempts < 120; attempts++) {
      await delay(500);

      const pollResponse = await fetch(polling_url, {
        headers: {
          accept: 'application/json',
          'x-key': params.apiKey
        }
      });

      if (!pollResponse.ok) {
        return Promise.reject({
          error: `Polling failed: ${pollResponse.status}`
        });
      }

      const result = FluxResultSchema.parse(await pollResponse.json());

      // check status using Zod enum
      switch (result.status) {
        case FluxStatus.enum.Ready:
          if (result.result?.sample) {
            return {
              image_url: result.result.sample
            };
          }
          break;
        case FluxStatus.enum.Error:
        case FluxStatus.enum.Failed:
          return Promise.reject({
            error: result.error || 'Image generation failed'
          });
        case FluxStatus.enum.Pending:
          // continue polling
          break;
      }
    }

    return Promise.reject({
      error: 'Image generation timeout, please try again later'
    });
  } catch (error: any) {
    return Promise.reject({
      error
    });
  }
}
