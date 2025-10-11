import { z } from 'zod';
import { POST } from '@tool/utils/request';
import { uploadFile } from '@tool/utils/uploadFile';

export const InputType = z.object({
  apiKey: z.string(),
  text: z.string(),
  aspect_ratio: z.enum(['1:1', '2:3', '3:4', '4:3', '2:1', '3:2', '16:9', '9:16', '21:9', '9:21'])
});

export const OutputType = z.object({
  imageUrl: z.string()
});

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function tool({
  apiKey,
  text,
  aspect_ratio
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const token = `Bearer ${apiKey}`;
  const { data } = await POST(
    OPENROUTER_BASE_URL,
    {
      model: 'google/gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: text,
          modalities: ['image', 'text'],
          image_config: {
            aspect_ratio: aspect_ratio
          }
        }
      ]
    },
    {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      }
    }
  );

  // modal response is a base64 string
  const dataUrl = data.choices[0].message.images[0].image_url.url;
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    return Promise.reject('Failed to generate image');
  }

  const match = dataUrl.match(/^data:([^;]+);base64,/);
  const mime = match?.[1];
  const ext = (() => {
    const m = mime.split('/')[1];
    return m && m.length > 0 ? m : 'png';
  })();
  const defaultFilename = `image.${ext}`;

  const meta = await uploadFile({ base64: dataUrl, defaultFilename });
  if (!meta.accessUrl) {
    return Promise.reject('Failed to upload image');
  }
  return {
    imageUrl: meta.accessUrl
  };
}
