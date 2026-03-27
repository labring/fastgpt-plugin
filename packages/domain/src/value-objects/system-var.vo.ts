import z from 'zod';

export const SystemVarSchema = z.object({
  user: z.object({
    id: z.string(),
    username: z.string(),
    contact: z.string(),
    membername: z.string(),
    teamName: z.string(),
    teamId: z.string(),
    name: z.string()
  }),
  app: z.object({
    id: z.string(),
    name: z.string()
  }),
  tool: z.object({
    id: z.string(),
    version: z.string(),
    prefix: z.string().optional()
  }),
  time: z.string()
});

export type SystemVarType = z.infer<typeof SystemVarSchema>;
