import { z } from 'zod';
import { delay } from '@tool/utils/delay';

const FluxStatus = z.enum(['Pending', 'Ready', 'Error', 'Failed']);

// Helper function to convert image to base64
async function imageToBase64(input: string): Promise<string> {
  // If it's already base64 (doesn't start with http/https), return as is
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    return input;
  }

  // If it's a URL, fetch and convert to base64
  try {
    const response = await fetch(input);
    if (!response.ok) {
      return Promise.reject(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Convert to base64
    let binary = '';
    uint8Array.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary);
  } catch (error) {
    return Promise.reject(
      `Failed to process image URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export const InputType = z.object({
  apiKey: z.string().describe('API key for accessing Black Forest Labs FLUX.1 service'),
  prompt: z.string().describe('Text prompt describing the edit to be applied to the image'),
  input_image: z
    .string()
    .describe(
      'Image to use as reference for editing. Can be a URL (http/https) or base64 encoded image data. Supports up to 20MB or 20 megapixels.'
    ),
  aspect_ratio: z
    .enum([
      '3:7',
      '4:7',
      '1:2',
      '9:16',
      '2:3',
      '3:4',
      '1:1',
      '4:3',
      '3:2',
      '16:9',
      '2:1',
      '7:4',
      '7:3'
    ])
    .optional()
    .describe(
      'Desired aspect ratio. All outputs are ~1MP total. Supports ratios from 3:7 to 7:3. Defaults to 1:1 if not specified.'
    ),
  seed: z.number().optional().describe('Random seed for reproducible generation (optional)'),
  prompt_upsampling: z
    .boolean()
    .optional()
    .describe('Enable prompt upsampling to enhance the input prompt. Defaults to false.'),
  safety_tolerance: z.coerce
    .number()
    .min(0)
    .max(2)
    .optional()
    .describe(
      'Safety tolerance level (0-2, where 0 is most strict and 2 is balanced). Defaults to 2.'
    ),
  output_format: z
    .enum(['jpeg', 'png'])
    .optional()
    .describe('Output image format. Defaults to jpeg.')
});

export const OutputType = z.object({
  image_url: z.string().describe('URL to access the edited image')
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
    // Convert input_image to base64 if needed
    const base64Image = await imageToBase64(params.input_image);

    const requestBodySchema = InputType.omit({ apiKey: true });
    const requestBody = requestBodySchema.parse({
      ...params,
      input_image: base64Image
    });

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
      return Promise.reject(`HTTP error! status: ${response.status}`);
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
        return Promise.reject(`Polling failed: ${pollResponse.status}`);
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
            error: result.error || 'Image editing failed'
          });
        case FluxStatus.enum.Pending:
          // continue polling
          break;
      }
    }

    return Promise.reject({
      error: 'Image editing timeout, please try again later'
    });
  } catch (error: unknown) {
    return Promise.reject({
      error
    });
  }
}
