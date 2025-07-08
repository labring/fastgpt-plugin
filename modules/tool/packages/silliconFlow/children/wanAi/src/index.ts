import { addLog } from '@/utils/log';
import { delay } from '@tool/utils/delay';
import { z } from 'zod';

export const InputType = z
  .object({
    authorization: z.string().describe('API token (without Bearer), e.g., sk-xxxx'),
    model: z
      .enum([
        'Wan-AI/Wan2.1-T2V-14B',
        'Wan-AI/Wan2.1-T2V-14B-Turbo',
        'Wan-AI/Wan2.1-I2V-14B-720P',
        'Wan-AI/Wan2.1-I2V-14B-720P-Turbo'
      ])
      .default('Wan-AI/Wan2.1-T2V-14B')
      .describe('Model name'),
    prompt: z.string().describe('Text prompt for video generation'),
    image_size: z
      .enum(['1280x720', '720x1280', '960x960'])
      .default('1280x720')
      .describe('Aspect ratio of the generated content'),
    negative_prompt: z.string().optional().describe('Negative prompt to exclude unwanted elements'),
    image: z
      .string()
      .url()
      .or(z.string().startsWith('data:image/'))
      .optional()
      .describe(
        'Required for some models. Supports base64 or image URL, e.g., "data:image/png;base64,XXX" or image link'
      ),
    seed: z.number().optional().describe('Random seed for controlling generation randomness')
  })
  .describe('Silicon Flow video generation API parameters');

export const OutputType = z.object({
  status: z.enum(['Succeed', 'InQueue', 'InProgress', 'Failed']).describe('Operation status'),
  url: z.string().describe('Video URL'),
  results: z
    .object({
      videos: z.array(z.string().url()).describe('Array of generated video URLs, valid for 1 hour'),
      timings: z
        .object({ inference: z.number().describe('Inference time') })
        .describe('Timing information'),
      seed: z.number().describe('Seed value')
    })
    .describe('Result object containing videos, timings, and seed')
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const url = 'https://api.siliconflow.cn/v1/video';
  const { authorization, ...params } = props;

  const submitBody = Object.fromEntries(
    Object.entries({
      model: params.model,
      prompt: params.prompt,
      image_size: params.image_size,
      negative_prompt: params.negative_prompt,
      seed: params.seed,
      image: params.image
    }).filter(([, value]) => value !== undefined)
  );

  // 1. Submit generation task
  const submitRes = await fetch(`${url}/submit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authorization}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(submitBody)
  });

  const submitData = await submitRes.json();
  if (!submitRes.ok || !submitData.requestId) {
    return Promise.reject(`Task submission failed: ${submitData?.message || submitRes.statusText}`);
  }

  // 2. Poll for result
  let statusRes: Response | undefined = undefined;
  let statusData: any = undefined;
  for (let i = 0; i < 180; i++) {
    await delay(3000);
    statusRes = await fetch(`${url}/status`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authorization}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requestId: submitData.requestId })
    });
    statusData = await statusRes.json();
    if (statusData.status === 'Succeed' || statusData.status === 'Failed') {
      break;
    }
  }

  if (!statusRes || !statusRes.ok) {
    return Promise.reject(`Failed to get result: ${statusData?.message || statusRes?.statusText}`);
  }

  return {
    status: statusData.status,
    results: statusData.results,
    url: statusData.results?.videos?.[0]
  };
}
