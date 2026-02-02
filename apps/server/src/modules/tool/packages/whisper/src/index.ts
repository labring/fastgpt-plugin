import { z } from 'zod';
import { POST, GET } from '@tool/utils/request';

export const InputType = z.object({
  baseUrl: z.string().optional().default('https://api.openai.com/v1'),
  apiKey: z.string().nonempty(),
  file: z.string().nonempty(),
  model: z.string().nonempty()
});

export const OutputType = z.object({
  text: z.string()
});

// convert file input (URL or base64) to File object
async function inputToFile(file: string): Promise<File> {
  if (file.startsWith('http://') || file.startsWith('https://')) {
    const { data } = await GET(file, { responseType: 'blob' });
    return new File([data], 'audio.m4a', { type: data.type || 'audio/m4a' });
  }
  // if base64 has "data:" prefix
  if (file.startsWith('data:')) {
    const base64Match = file.match(/^data:audio\/[^;]+;base64,(.+)$/);
    if (!base64Match) {
      return Promise.reject('Invalid base64 format. Please provide a valid base64 data.');
    }
    const binaryString = atob(base64Match[1]);
    const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
    return new File([bytes], 'audio.m4a', { type: `audio/m4a` });
  }
  // if base64 is pure base64 string
  if (file.match(/^[A-Za-z0-9+/=]+$/)) {
    const binaryString = atob(file);
    const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
    return new File([bytes], 'audio.m4a', { type: 'audio/m4a' });
  }
  return Promise.reject('Invalid file format. Please provide a URL or base64 data.');
}

export async function tool({
  baseUrl,
  apiKey,
  file,
  model
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  // Convert file input to File object
  const audioFile = await inputToFile(file);
  if (audioFile.size === 0) {
    return Promise.reject('Audio file is empty');
  }

  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('model', model);

  const { data } = await POST(`${baseUrl}/audio/transcriptions`, formData, {
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });

  const text = data?.text;
  if (!text) {
    return Promise.reject('No transcription text found in response');
  }

  return { text };
}
