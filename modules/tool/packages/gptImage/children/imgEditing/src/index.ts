import { z } from 'zod';
import { uploadFile } from '@tool/utils/uploadFile';
import { POST, GET } from '@tool/utils/request';

export const InputType = z.object({
  baseUrl: z.string().optional().default('https://api.openai.com/v1'),
  apiKey: z.string().nonempty(),
  image: z.string().nonempty(),
  prompt: z.string().nonempty(),
  size: z.string().default('1024x1024'),
  quality: z.string().default('medium')
});

export const OutputType = z.object({
  imageUrl: z.string()
});

// convert image input (URL or base64) to Blob
async function imageInputToBlob(imageInput: string): Promise<Blob> {
  // if input image is url
  if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    const { data } = await GET(imageInput, { responseType: 'blob' });
    return data as Blob;
  }

  let base64Data = imageInput;
  let mimeType = 'image/png';

  if (imageInput.startsWith('data:')) {
    const match = imageInput.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error('Invalid data URL format');
    [, mimeType, base64Data] = match;
  }

  // convert base64 to Blob
  const binary = atob(base64Data);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

export async function tool({
  baseUrl,
  apiKey,
  image,
  prompt,
  size,
  quality
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const imageBlob = await imageInputToBlob(image);
  const formData = new FormData();
  formData.append('model', 'gpt-image-1');
  formData.append('image', imageBlob, 'image.png');
  formData.append('prompt', prompt);
  formData.append('size', size);
  formData.append('quality', quality);

  const { data } = await POST(`${baseUrl}/v1/images/edits`, formData, {
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    timeout: 180000
  });
  if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
    return Promise.reject('Failed to edit image or no image data returned');
  }

  // get the first edited image
  const imageData = data.data[0];
  const imageBuffer = Buffer.from(imageData.b64_json, 'base64');
  if (imageBuffer.length === 0) {
    return Promise.reject('Failed to convert base64 image data to buffer');
  }

  const { accessUrl: imageUrl } = await uploadFile({
    buffer: imageBuffer,
    defaultFilename: 'gpt-image-edited.png'
  });
  if (!imageUrl) {
    return Promise.reject('Failed to upload edited image file');
  }

  return { imageUrl };
}
