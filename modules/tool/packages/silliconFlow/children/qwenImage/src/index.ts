import { addLog } from '@/utils/log';
import { POST } from '@tool/utils/request';
import { z } from 'zod';

// Define input schema for the Silicon Flow painting API
export const InputType = z
  .object({
    authorization: z.string().describe('API token (without Bearer), e.g., sk-xxxx'),
    prompt: z.string().describe('Text prompt for image generation'),
    image_size: z
      .enum([
        '1328x1328',
        '1664x928',
        '928x1664',
        '1472x1140',
        '1140x1472',
        '1584x1056',
        '1056x1584'
      ])
      .default('1328x1328')
      .describe('Image size'),
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
  const { authorization, ...params } = props;

  // Build request body, filtering out undefined values
  const body = Object.fromEntries(
    Object.entries({
      model: 'Qwen/Qwen-Image',
      prompt: params.prompt,
      image_size: params.image_size,
      negative_prompt: params.negative_prompt,
      seed: params.seed
    }).filter(([, value]) => value !== undefined)
  );

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
