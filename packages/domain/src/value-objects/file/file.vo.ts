import { Readable } from 'stream';
import z from 'zod';

import { MIMESchema } from './MIME.vo';

export const FileMetaSchema = z.object({
  fileKey: z.string(),
  fileName: z.string(),
  contentType: MIMESchema,
  size: z.number(),
  etag: z.string(),
  createTime: z.date()
});

export type FileMetaType = z.infer<typeof FileMetaSchema>;

export const FileCreateSchema = z.object({
  /** 如果未提供 fileKey，则生成一个随机值 */
  fileKey: z.string().optional(),
  /** 路径，将会拼接在 fileName 之前 */
  path: z.string().optional(),
  /** 如果未提供fileName，则默认设置为 fileKey 的值 */
  fileName: z.string().optional(),
  /** 如果未提供 contentType，则尝试进行探测，探测失败则设置为 application/octet-stream */
  contentType: MIMESchema.optional(),
  overwrite: z.boolean().optional(),
  file: z.union([
    z.instanceof(Readable, {
      error: 'Stream cannot be empty'
    }),
    z
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
  ])
});

export type FileCreateType = z.infer<typeof FileCreateSchema>;
