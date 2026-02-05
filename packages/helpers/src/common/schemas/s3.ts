import z from 'zod';

export const FileMetadataSchema = z.object({
  originalFilename: z.string(),
  contentType: z.string(),
  size: z.number(),
  uploadTime: z.date(),
  accessUrl: z.string(),
  objectName: z.string()
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;
