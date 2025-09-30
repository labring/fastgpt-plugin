import { z } from 'zod';
import { createPPT, getPPTPreviewUrl } from './utils.ts';

export const InputType = z.object({
  apiKey: z.string(),
  text: z.string(),
  color: z.string()
});

export const OutputType = z.object({
  preview_url: z.string()
});

export async function tool({ apiKey, text, color }: z.infer<typeof InputType>) {
  const token = `Bearer ${apiKey}`;
  try {
    const id = await createPPT(token, text, color);
    const pptEditUrl = await getPPTPreviewUrl(token, id);
    return {
      preview_url: pptEditUrl
    };
  } catch (error) {
    return Promise.reject(error);
  }
}
