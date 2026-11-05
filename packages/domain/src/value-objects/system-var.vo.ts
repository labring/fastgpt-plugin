import z from 'zod';

export const SystemVarSchema = z.object({
  app: z.object({
    id: z.string(),
    name: z.string()
  }),
  chat: z.object({
    chatId: z.string(),
    uid: z.string().optional(),
    usageId: z.string().optional()
  }),
  invokeToken: z.string(),
  time: z.string(),
  usageId: z.string().optional()
});

export type SystemVarType = z.infer<typeof SystemVarSchema>;
