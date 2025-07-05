import { addLog } from '@/utils/log';
import { z } from 'zod';

// Define input schema for the Silicon Flow painting API
export const InputType = z
  .object({
    authorization: z.string().describe('API token (without Bearer), e.g., sk-xxxx'),
    model: z
      .enum(['Kwai-Kolors/Kolors'])
      .default('Kwai-Kolors/Kolors')
      .describe('Model name, currently only supports Kwai-Kolors/Kolors'),
    prompt: z.string().describe('Text prompt for image generation'),
    image_size: z
      .enum(['1024x1024', '960x1280', '768x1024', '720x1440', '720x1280', '512x512', '2048x2048'])
      .default('1024x1024')
      .describe('Image size'),
    batch_size: z
      .number()
      .min(1)
      .max(4)
      .default(1)
      .describe('Number of images to generate, range 1-4'),
    num_inference_steps: z
      .number()
      .min(1)
      .max(100)
      .default(20)
      .describe('Number of inference steps, range 1-100'),
    guidance_scale: z
      .number()
      .min(0)
      .max(20)
      .default(7.5)
      .describe('Controls how closely the image matches the prompt, range 0-20'),
    negative_prompt: z
      .string()
      .optional()
      .describe('Negative prompt to exclude unwanted elements in the image'),
    seed: z
      .number()
      .min(0)
      .max(9999999999)
      .optional()
      .describe('Random seed for image generation, range 0-9999999999'),
    image: z
      .union([
        z.string().url(),
        z.string().startsWith('data:image/'),
        z
          .string()
          .length(0)
          .transform(() => undefined)
      ])
      .optional()
      .describe(
        'Image to upload, supports image URL or base64 format, e.g., "https://xxx/xx.png" or "data:image/png;base64,XXX"'
      )
  })
  .describe('Silicon Flow painting API parameters');

// Define output schema for the Silicon Flow painting API
export const OutputType = z.object({
  images: z.array(z.string().url()).describe('List of generated image URLs'),
  timings: z
    .object({
      inference: z.number().describe('Inference time in milliseconds')
    })
    .passthrough()
    .describe('Timing information for the inference process'),
  seed: z.number().describe('Random seed for image generation').optional()
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

// Convert image URL to base64 format
export async function urlToBase64(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl);
  if (!res.ok)
    return Promise.reject(
      `Failed to fetch image from ${imageUrl}: ${res.status} ${res.statusText}`
    );
  const buffer = Buffer.from(await res.arrayBuffer());
  // Infer MIME type
  const mime = imageUrl.endsWith('.png')
    ? 'image/png'
    : imageUrl.endsWith('.jpg') || imageUrl.endsWith('.jpeg')
      ? 'image/jpeg'
      : 'image/png';
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

// Main tool function for Silicon Flow painting API
export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  // Hardcoded API URL
  const url = 'https://api.siliconflow.cn/v1/images/generations';
  const { authorization, ...params } = props;
  // Automatically convert image field to base64
  const image = await (async () => {
    if (!params.image) return undefined;
    if (params.image.startsWith('data:image/')) return params.image;
    return await urlToBase64(params.image);
  })();

  // Build request body, filtering out undefined values
  const body = Object.fromEntries(
    Object.entries({
      model: params.model,
      prompt: params.prompt,
      image_size: params.image_size,
      batch_size: params.batch_size,
      num_inference_steps: params.num_inference_steps,
      guidance_scale: params.guidance_scale,
      negative_prompt: params.negative_prompt,
      seed: params.seed,
      image
    }).filter(([, value]) => value !== undefined)
  );

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authorization}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  addLog.info(`[Silicon Flow] Request: ${url} - Body: ${JSON.stringify(body)}`);
  const data = await response.json();

  if (!response.ok) {
    const errorHandler = ERROR_MESSAGES[response.status as keyof typeof ERROR_MESSAGES];
    const message = errorHandler
      ? errorHandler(data)
      : typeof data === 'object' && data?.message
        ? data.message
        : `Response error: ${response.status} ${response.statusText}`;

    return Promise.reject(message);
  }

  return {
    ...data,
    images: Array.isArray(data.images)
      ? data.images.map((item: any) => (typeof item === 'string' ? item : item.url))
      : []
  };
}
