import { z } from 'zod';
import { FileMetadataSchema, type FileMetadata } from '@/s3/config';
import { FileInputSchema } from '@/s3/type';
import { StreamDataSchema, ToolCallbackReturnSchema } from '@tool/type/req';

declare global {
  var uploadFileResponseFnMap: Map<string, (data: { data?: FileMetadata; error?: string }) => void>;
}

/**
 * Worker --> Main Thread
 */
export const Worker2MainMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('uploadFile'),
    data: z.object({ id: z.string(), file: FileInputSchema })
  }),
  z.object({
    type: z.literal('log'),
    data: z.array(z.any())
  }),
  z.object({
    type: z.literal('done'),
    data: ToolCallbackReturnSchema
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
      filename: z.string(),
      dev: z.boolean()
    })
  }),
  z.object({
    type: z.literal('uploadFileResponse'),
    data: z.object({
      id: z.string(),
      data: FileMetadataSchema.optional(),
      error: z.string().optional()
    })
  })
]);

export type Worker2MainMessageType = z.infer<typeof Worker2MainMessageSchema>;
export type Main2WorkerMessageType = z.infer<typeof Main2WorkerMessageSchema>;
