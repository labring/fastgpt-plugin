import { z } from 'zod';
import { uploadFile } from '@tool/utils/uploadFile';

export const InputType = z.object({
  base64: z.string().nonempty()
});

export const OutputType = z.object({
  text: z.string()
});

/**
 * Convert base64 image data to a file and return its URL, type, and size
 * Supports both data URL format (with MIME type) and raw base64 (auto-detected)
 */
export async function tool({
  base64
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  // Remove data URL prefix if present (e.g., "data:text/plain;base64,")
  const cleanBase64 = base64.replace(/^data:[^;]*;base64,/, '');

  // Decode base64 to text using Buffer (Node.js) or atob (browser)
  const decodedText =
    typeof Buffer !== 'undefined'
      ? Buffer.from(cleanBase64, 'base64').toString('utf-8')
      : decodeURIComponent(escape(atob(cleanBase64)));

  return {
    text: decodedText
  };
}
