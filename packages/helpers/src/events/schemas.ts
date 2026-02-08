import z from 'zod';
import type { StreamDataType } from '../tools/schemas/req';
import type { FileMetadata } from '../common/schemas/s3';
import type { InvokeInput } from './type';

export const EventEnumSchema = z.enum([
  'file-upload',
  'stream-response',
  'html2md',
  'cherrio2md',
  'invoke'
]);

export const EventEnum = EventEnumSchema.enum;
export type EventEnumType = z.infer<typeof EventEnumSchema>;

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

/**
 * Cheerio 转 Markdown 参数
 */
export const Cherrio2MdInputSchema = z.object({
  fetchUrl: z.url('Invalid URL format'),
  selector: z.string().optional().default('body')
});

export type Cherrio2MdInput = z.input<typeof Cherrio2MdInputSchema>;

/**
 * Cheerio 转 Markdown 结果
 */
export const Cherrio2MdResultSchema = z.object({
  markdown: z.string(),
  title: z.string()
});

export type Cherrio2MdResult = z.infer<typeof Cherrio2MdResultSchema>;

export type EventDataType<T extends EventEnumType> = T extends 'file-upload'
  ? FileInput
  : T extends 'stream-response'
    ? StreamDataType
    : T extends 'html2md'
      ? { html: string }
      : T extends 'cherrio2md'
        ? {
            fetchUrl: string;
            html: string;
            selector?: string;
          }
        : T extends 'invoke'
          ? InvokeInput
          : never;

export type EventResponseType<T extends EventEnumType> = T extends 'file-upload'
  ? FileMetadata
  : T extends 'stream-response'
    ? void
    : T extends 'html2md'
      ? string
      : T extends 'cherrio2md'
        ? Cherrio2MdResult
        : T extends 'invoke'
          ? unknown
          : never;
