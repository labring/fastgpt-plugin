import z from 'zod';

export const EventEnum = z.enum(['file-upload', 'stream-response', 'html2md', 'cherrio2md']);
export type EventEnumType = z.infer<typeof EventEnum>;

export const FileInputSchema = z
  .object({
    url: z.url('Invalid URL format').optional(),
    path: z.string().min(1, 'File path cannot be empty').optional(),
    base64: z.string().min(1, 'Base64 data cannot be empty').optional(),
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
      error: 'Provide exactly one input method. Filename required for base64/buffer inputs.'
    }
  );
export type FileInput = z.infer<typeof FileInputSchema>;

export const FileUploadSchema = z.object({
  event: z.literal(EventEnum.enum['file-upload']),
  data: FileInputSchema
});

export type FileUploadType = z.infer<typeof FileUploadSchema>;

/**
 * Cheerio 转 Markdown 参数
 */
export const Cherrio2MdInputSchema = z.object({
  fetchUrl: z.string().url('Invalid URL format'),
  html: z.string().min(1, 'HTML content cannot be empty'),
  selector: z.string().optional().default('body')
});
export type Cherrio2MdInput = z.infer<typeof Cherrio2MdInputSchema>;

/**
 * Cheerio 转 Markdown 结果
 */
export const Cherrio2MdResultSchema = z.object({
  markdown: z.string(),
  title: z.string(),
  usedSelector: z.string()
});
export type Cherrio2MdResult = z.infer<typeof Cherrio2MdResultSchema>;

export const Cherrio2MdSchema = z.object({
  event: z.literal(EventEnum.enum['cherrio2md']),
  data: Cherrio2MdInputSchema
});
export type Cherrio2MdType = z.infer<typeof Cherrio2MdSchema>;

export const EventSchema = z.discriminatedUnion('event', [FileUploadSchema, Cherrio2MdSchema]);

export type EventType = z.infer<typeof EventSchema>;
