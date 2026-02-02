import { z } from 'zod';
import { uploadFile } from '@tool/utils/uploadFile';

/**
 * Detect image MIME type from base64 binary data by checking file signatures
 * Supports pdf, docx, xlsx, pptx, zip, wav, avi formats
 */
function detectFileType(base64Data: string) {
  try {
    // Remove data URL prefix if exists and decode base64
    const base64Content = base64Data.replace(/^data:[^;]+;base64,/, '');
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // PDF: 25 50 44 46
    if (
      bytes.length >= 4 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46
    ) {
      return 'application/pdf';
    }

    // zip: 50 4B 03 04
    // .docx, .xlsx, .pptx are special zip files
    if (
      bytes.length >= 4 &&
      bytes[0] === 0x50 &&
      bytes[1] === 0x4b &&
      bytes[2] === 0x03 &&
      bytes[3] === 0x4
    ) {
      // detect specific file paths inside the ZIP to identify the specific Office type
      // check the first 10000 bytes to see if it contains specific file paths
      const text = binaryString.substring(0, 10000);

      if (text.includes('word/')) {
        return 'application/docx';
      } else if (text.includes('xl/')) {
        return 'application/xlsx';
      } else if (text.includes('ppt/')) {
        return 'application/pptx';
      } else {
        return 'application/zip';
      }
    }

    // csv: check if it contains comma separated structure
    if (/^[^\n]*,[^\n]*$/.test(binaryString.substring(0, 1000))) {
      return 'text/csv';
    }

    // html: check if it includes <html> or <!doctype html>
    if (
      binaryString.substring(0, 100).toLowerCase().includes('<html') ||
      binaryString.substring(0, 100).toLowerCase().includes('<!doctype html')
    ) {
      return 'text/html';
    }

    // txt: check if it is pure ASCII text
    if (/^[\x20-\x7E\s]*$/.test(binaryString.substring(0, 1000))) {
      return 'text/txt';
    }

    return null;
  } catch {
    return null;
  }
}

export const InputType = z.object({
  base64: z.string().nonempty()
});

export const OutputType = z.object({
  url: z.string()
});

export async function tool({
  base64
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const mime = (() => {
    const match = base64.match(/^data:([^;]+);base64,/);
    if (match?.[1]) {
      return match[1];
    }
    const detectedType = detectFileType(base64);

    if (!detectedType) {
      throw new Error(
        'File Type unknown, current supported file types: pdf, docx, xlsx, pptx, zip, csv, html, txt'
      );
    }
    return detectedType;
  })();

  const ext = (() => {
    const m = mime.split('/')[1];
    // octet-stream: unknown binary data
    return m && m.length > 0 ? m : 'octet-stream';
  })();

  const filename = `file.${ext}`;

  const meta = await uploadFile({ base64, defaultFilename: filename });

  return {
    url: meta.accessUrl
  };
}
