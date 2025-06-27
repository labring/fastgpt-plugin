import { addLog } from '@/utils/log';
import { z } from 'zod';

export const InputType = z
  .object({
    ms: z.number().min(1).max(300000).optional(), // 延迟时长，单位毫秒
    延时时长: z.number().min(1).max(300000).optional()
  })
  .refine((data) => {
    return data.ms || data.延时时长 || 1;
  })
  .transform((data) => {
    return {
      ...data,
      ms: data.ms || data.延时时长
    };
  });

export const OutputType = z.object({});

export async function tool({
  ms = 1
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  // delay for ms milliseconds
  await new Promise((resolve) => setTimeout(resolve, ms));
  return {};
}
