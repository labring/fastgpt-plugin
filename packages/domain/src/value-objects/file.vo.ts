import z from 'zod';
import { Readable } from 'stream';

export const BaseFileMetaSchema = z.object({
  fileKey: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  size: z.number(),
  etag: z.string(),
  createTime: z.date()
});

export type BaseFileMeta = z.infer<typeof BaseFileMetaSchema>;

export const BaseFileCreateSchema = z.object({
  fileKey: z.string('File key is required'),
  /** 如果未提供fileName，则设置为一个随机值 */
  fileName: z.string().optional(),
  /** 如果未提供 contentType，则尝试进行探测，探测失败则设置为 application/octet-stream */
  contentType: z.string().optional(),
  overwrite: z.boolean().optional(),
  file: z
    .object({
      url: z.url('Invalid URL format').optional(),
      path: z.string().min(1, 'File path cannot be empty').optional(),
      base64: z.string().min(1, 'Base64 data cannot be empty').optional(),
      stream: z
        .instanceof(Readable, {
          error: 'Stream cannot be empty'
        })
        .optional(),
      buffer: z
        .union([
          z.instanceof(Buffer, { error: 'Buffer is required' }),
          z.instanceof(Uint8Array, { error: 'Uint8Array is required' })
        ])
        .transform((data) => {
          if (data instanceof Uint8Array && !(data instanceof Buffer)) {
            return Buffer.from(data);
          }
          return data;
        })
        .optional()
    })
    .refine(
      (data) => {
        const inputMethods = [data.url, data.path, data.base64, data.buffer].filter(Boolean);
        return inputMethods.length === 1;
      },
      {
        error: 'Provide exactly one input method.'
      }
    )
});

export type BaseFileCreateType = z.infer<typeof BaseFileCreateSchema>;

export const RemoteFileMetaSchema = z.object({
  ...BaseFileMetaSchema.shape,
  expireAt: z.date().optional(),
  access: z.enum(['public', 'private']).optional()
});

export type RemoteFileMetaType = z.infer<typeof RemoteFileMetaSchema>;

export const RemoteFileCreateSchema = z.object({
  ...BaseFileCreateSchema.shape,
  /** 不传 = 不过期 */
  expireAt: z.date().optional(),
  access: z.enum(['public', 'private']).default('private')
});

export type RemoteFileCreateType = z.infer<typeof RemoteFileCreateSchema>;
