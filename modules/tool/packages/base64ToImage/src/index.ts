import { z } from 'zod';
import { uploadFile } from '@tool/utils/uploadFile';

export const InputType = z.object({
  base64: z.string()
});

export const OutputType = z.object({
  url: z.string(),
  type: z.string(),
  size: z.number()
});

export async function tool({
  base64
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  // Infer the extension from the dataURL, otherwise default to png
  const mime = base64.match(/^data:([^;]+);base64,/)?.[1] ?? 'image/png';
  const ext = (() => {
    const m = mime.split('/')[1];
    return m && m.length > 0 ? m : 'png';
  })();
  // default filename
  const filename = `image.${ext}`;

  const meta = await uploadFile({ base64, defaultFilename: filename });

  return {
    url: meta.accessUrl,
    type: meta.contentType,
    size: meta.size
  };
}
