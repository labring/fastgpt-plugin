import { z } from 'zod';
import { POST } from '@tool/utils/request';

export const InputType = z.object({
  apiKey: z.string().describe('Alibaba Cloud Qwen API Key'),
  image1: z.string().describe('First input image URL or Base64 encoded data (required)'),
  image2: z
    .string()
    .optional()
    .describe('Second input image URL or Base64 encoded data (optional)'),
  image3: z.string().optional().describe('Third input image URL or Base64 encoded data (optional)'),
  prompt: z
    .string()
    .describe(
      'Positive prompt describing the desired image content. Supports Chinese and English, up to 800 characters'
    ),
  negative_prompt: z
    .string()
    .optional()
    .describe(
      'Negative prompt describing content that should not appear in the image, up to 500 characters'
    ),
  seed: z
    .number()
    .int()
    .min(0)
    .max(2147483647)
    .optional()
    .describe('Random seed to control the randomness of model generation')
});

export const OutputType = z.object({
  image: z.string().describe('generated image URL')
});

type QwenResponse = {
  output: {
    choices: {
      message: {
        content: { image: string }[];
      };
    }[];
  };
};

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const url =
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
  const { apiKey, image1, image2, image3, prompt, negative_prompt, seed } = props;

  const content = [
    { image: image1 },
    ...(image2 ? [{ image: image2 }] : []),
    ...(image3 ? [{ image: image3 }] : []),
    { text: prompt }
  ];

  const requestBody = {
    model: 'qwen-image-edit',
    input: {
      messages: [
        {
          role: 'user',
          content
        }
      ]
    },
    stream: false,
    negative_prompt,
    seed
  };

  const { data } = await POST<QwenResponse>(url, requestBody, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 180000
  });

  const image_url = data?.output?.choices[0]?.message?.content[0]?.image;

  if (!data || !image_url) {
    return Promise.reject('Failed to generate image');
  }

  return {
    image: image_url
  };
}
