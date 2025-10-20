import { z } from 'zod';
import { POST } from '@tool/utils/request';
import { uploadFile } from '@tool/utils/uploadFile';

export const InputType = z.object({
  baseUrl: z.string().optional().default('https://api.openai.com/v1'),
  apiKey: z.string().nonempty(),
  prompt: z.string().nonempty(),
  size: z.string().default('1024x1024'),
  quality: z.string().default('medium'),
  background: z.string().default('auto'),
  moderation: z.string().default('auto')
});

export const OutputType = z.object({
  imageUrl: z.string()
});

export async function tool({
  baseUrl,
  apiKey,
  prompt,
  size,
  quality,
  background,
  moderation
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  const { data } = await POST(
    `${baseUrl}/v1/images/generations`,
    {
      model: 'gpt-image-1',
      prompt,
      quality,
      size,
      background,
      moderation
    },
    {
      headers,
      timeout: 180000
    }
  );
  if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
    return Promise.reject('Failed to generate image or no image data returned');
  }

  const imageData = data.data[0];
  const imageBuffer = Buffer.from(imageData.b64_json, 'base64');
  if (imageBuffer.length === 0) {
    return Promise.reject('Failed to convert base64 image data to buffer');
  }

  const { accessUrl: imageUrl } = await uploadFile({
    buffer: imageBuffer,
    defaultFilename: 'gpt-image-generated.png'
  });
  if (!imageUrl) {
    return Promise.reject('Failed to upload image file');
  }

  return { imageUrl };
}
