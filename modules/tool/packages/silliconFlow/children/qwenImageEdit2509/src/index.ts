import { addLog } from '@/utils/log';
import { POST } from '@tool/utils/request';
import { z } from 'zod';

// Define input schema for the Silicon Flow painting API
export const InputType = z
  .object({
    authorization: z.string().describe('API token (without Bearer), e.g., sk-xxxx'),
    prompt: z.string().describe('Text prompt for image generation'),
    image: z.string().describe('Reference image 1 (URL or base64 format)'),
    image2: z.string().optional().describe('Reference image 2 (URL or base64 format)'),
    image3: z.string().optional().describe('Reference image 3 (URL or base64 format)'),
    negative_prompt: z
      .string()
      .optional()
      .describe('Negative prompt to exclude unwanted elements in the image'),
    seed: z
      .number()
      .min(0)
      .max(9999999999)
      .optional()
      .describe('Random seed for image generation, range 0-9999999999')
  })
  .describe('Silicon Flow painting API parameters');

// Define output schema for the Silicon Flow painting API
export const OutputType = z.object({
  imageUrl: z.string().url().describe('List of generated image URLs')
});

// Error status code mapping
const ERROR_MESSAGES = {
  400: (data: any) => `Bad Request${data?.message ? `: ${data.message}` : ''}`,
  401: () => 'Invalid token',
  404: () => '404 page not found',
  429: (data: any) => `Rate limit${data?.message ? `: ${data.message}` : ': Too Many Requests'}`,
  503: (data: any) => `Service unavailable${data?.message ? `: ${data.message}` : ''}`,
  504: () => 'Gateway Timeout'
} as const;

// Main tool function for Silicon Flow painting API
export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  // Hardcoded API URL
  const url = 'https://api.siliconflow.cn/v1/images/generations';
  const { authorization, prompt, image, image2, image3, seed, negative_prompt } = props;

  // Build request body, filtering out undefined values
  // According to API docs, image2 and image3 should be arrays
  const bodyData: Record<string, any> = {
    model: 'Qwen/Qwen-Image-Edit-2509',
    prompt,
    image,
    ...(image2 && { image2 }),
    ...(image3 && { image3 }),
    ...(negative_prompt && { negative_prompt }),
    ...(seed !== undefined && { seed })
  };

  const body = bodyData;

  const { data } = await POST<{
    code: number;
    images: { url: string }[];
  }>(url, body, {
    headers: {
      Authorization: `Bearer ${authorization}`,
      'Content-Type': 'application/json',
      timeout: '180000'
    }
  });
  addLog.info(`[Silicon Flow] Request: ${url} - Body: ${JSON.stringify(body)}`);

  // Extract the first image URL from the response
  const imageUrl = Array.isArray(data.images) && data.images.length > 0 ? data.images[0].url : '';

  return {
    imageUrl
  };
}
