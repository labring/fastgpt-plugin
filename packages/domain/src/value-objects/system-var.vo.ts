import z from 'zod';

export const SystemVarSchema = z.object({
  app: z.object({
    id: z.string(),
    name: z.string()
  }),
  chat: z.object({
    chatId: z.string(),
    uid: z.string().optional()
  }),
  invokeToken: z.string(),
  time: z.string()
});

export type SystemVarType = z.infer<typeof SystemVarSchema>;
