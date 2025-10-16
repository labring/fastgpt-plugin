import { z } from 'zod';
import { POST } from '@tool/utils/request';

export const InputType = z.object({
  apiKey: z.string().describe('Doubao Seedream API Key'),
  model: z.string().nonempty().describe('model name'),
  prompt: z.string().nonempty().describe('describe the desired image content'),
  size: z.string().optional().describe('aspect ratio of the generated content'),
  seed: z.number().optional().describe('Random seed to control the randomness of model generation')
});

export const OutputType = z.object({
  image: z.string().describe('generated image URL')
});

type SeedreamResponse = {
  data: {
    url: string;
  }[];
};

export async function tool({
  apiKey,
  model,
  prompt,
  size,
  seed
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const url = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';

  const { data } = await POST<SeedreamResponse>(
    url,
    {
      model,
      prompt,
      size,
      seed
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const image_url = data?.data?.[0]?.url;
  if (!image_url) {
    return Promise.reject('Failed to generate image');
  }

  return {
    image: image_url
  };
}
