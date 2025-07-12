import z from 'zod';
import { FileInputSchema } from '@/s3/controller';
import { FileMetadataSchema, type FileMetadata } from '@/s3/config';
import { StreamDataSchema } from '@tool/type/tool';
import { ToolCallbackReturnSchema } from '@tool/type/tool';

declare global {
  var uploadFileResponseFn: (data: { data?: FileMetadata; error?: string }) => void | undefined;
}

/**
 * Worker --> Main Thread
 */
export const Worker2MainMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('uploadFile'),
    data: FileInputSchema
  }),
  z.object({
    type: z.literal('log'),
    data: z.array(z.any())
  }),
  z.object({
    type: z.literal('success'),
    data: ToolCallbackReturnSchema
  }),
  z.object({
    type: z.literal('error'),
    data: z.any()
  }),
  z.object({
    type: z.literal('stream'),
    data: StreamDataSchema
  })
]);

/**
 * Main Thread --> Worker
 */
export const Main2WorkerMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('runTool'),
    data: z.object({
      toolId: z.string(),
      inputs: z.any(),
      systemVar: z.any(),
      toolDirName: z.string()
    })
  }),
  z.object({
    type: z.literal('uploadFileResponse'),
    data: z.object({
      data: FileMetadataSchema.optional(),
      error: z.string().optional()
    })
  })
]);

export type Worker2MainMessageType = z.infer<typeof Worker2MainMessageSchema>;
export type Main2WorkerMessageType = z.infer<typeof Main2WorkerMessageSchema>;
