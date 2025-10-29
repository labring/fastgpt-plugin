import { z } from 'zod';

export const PresignedUrlInputSchema = z.object({
  filepath: z.string(),
  filename: z.string(),
  contentType: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  maxSize: z.number().optional().describe('B'),
  fileExpireMins: z.number().optional()
});

export type PresignedUrlInputType = z.infer<typeof PresignedUrlInputSchema>;

export const FileInputSchema = z
  .object({
    url: z.string().url('Invalid URL format').optional(),
    path: z.string().min(1, 'File path cannot be empty').optional(),
    base64: z.string().min(1, 'Base64 data cannot be empty').optional(),
    buffer: z
      .union([
        z.instanceof(Buffer, { message: 'Buffer is required' }),
        z.instanceof(Uint8Array, { message: 'Uint8Array is required' })
      ])
      .transform((data) => {
        if (data instanceof Uint8Array && !(data instanceof Buffer)) {
          return Buffer.from(data);
        }
        return data;
      })
      .optional(),
    defaultFilename: z.string().optional(),
    prefix: z.string().optional(),
    keepRawFilename: z.boolean().optional(),
    contentType: z.string().optional(),
    expireMins: z.number().optional()
  })
  .refine(
    (data) => {
      const inputMethods = [data.url, data.path, data.base64, data.buffer].filter(Boolean);
      return inputMethods.length === 1 && (!(data.base64 || data.buffer) || data.defaultFilename);
    },
    {
      message: 'Provide exactly one input method. Filename required for base64/buffer inputs.'
    }
  );
export type FileInput = z.infer<typeof FileInputSchema>;

export type GetUploadBufferResponse = { buffer: Buffer; filename: string };
