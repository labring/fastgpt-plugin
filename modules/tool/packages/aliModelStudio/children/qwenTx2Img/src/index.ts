import { z } from 'zod';
import { POST } from '@tool/utils/request';
import { getErrText } from '@tool/utils/err';

export const InputType = z.object({
  apiKey: z.string().describe('Alibaba Cloud Qwen API Key'),
  generateType: z
    .enum(['single', 'multiple'])
    .describe('Choose between single image editing and multiple image fusion'),
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
  watermark: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to add watermark, located at bottom right corner of image'),
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

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    const url =
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
    const {
      apiKey,
      generateType,
      image1,
      image2,
      image3,
      prompt,
      negative_prompt,
      watermark,
      seed
    } = props;

    // Validate required inputs
    if (!image1) {
      return Promise.reject({
        error: 'First image is required for image editing'
      });
    }

    const content =
      generateType === 'single'
        ? [{ image: image1 }, { text: prompt }]
        : [{ image: image1 }, { image: image2 }, { image: image3 }, { text: prompt }];

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
      watermark,
      seed
    };

    const { data } = await POST(url, requestBody, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 180000
    });

    const image_url = data.output.choices[0].message.content[0].image;
    // Check if response has valid structure
    if (!data || !image_url) {
      return Promise.reject({
        error: 'Invalid response from image generation service'
      });
    }

    return {
      image: image_url
    };
  } catch (error) {
    return Promise.reject({
      error: getErrText(error, 'Image editing request failed')
    });
  }
}
