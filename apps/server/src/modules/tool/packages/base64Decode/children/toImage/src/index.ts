import { z } from 'zod';
import { uploadFile } from '@tool/utils/uploadFile';

/**
 * Detect image MIME type from base64 binary data by checking file signatures
 * Supports JPEG, PNG, GIF, BMP, and WebP formats
 */
function detectImageMimeType(base64Data: string) {
  try {
    // Remove data URL prefix if exists and decode base64
    const base64Content = base64Data.replace(/^data:[^;]+;base64,/, '');
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Check for common image file signatures
    // JPEG: FF D8 FF
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return 'image/jpeg';
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return 'image/png';
    }

    // GIF: 47 49 46 38 (GIF8)
    if (
      bytes.length >= 4 &&
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38
    ) {
      return 'image/gif';
    }

    // BMP: 42 4D
    if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
      return 'image/bmp';
    }

    // WebP: RIFF + WEBP
    if (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return 'image/webp';
    }

    // Default to PNG if no signature matches
    return null;
  } catch {
    // If any error occurs during detection, default to PNG
    return null;
  }
}

export const InputType = z.object({
  base64: z.string().nonempty()
});

export const OutputType = z.object({
  url: z.string()
});

/**
 * Convert base64 image data to a file and return its URL, type, and size
 * Supports both data URL format (with MIME type) and raw base64 (auto-detected)
 */
export async function tool({
  base64
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  // First try to get MIME type from data URL
  const mime = (() => {
    const match = base64.match(/^data:([^;]+);base64,/);
    if (match?.[1]) {
      return match[1];
    }
    const detectedType = detectImageMimeType(base64);

    if (!detectedType) {
      throw new Error('Image Type unknown');
    }
    return detectedType;
  })();

  const ext = (() => {
    const m = mime.split('/')[1];
    return m && m.length > 0 ? m : 'png';
  })();

  // Generate filename with appropriate extension
  const filename = `image.${ext}`;

  const meta = await uploadFile({ base64, defaultFilename: filename });

  return {
    url: meta.accessUrl
  };
}
