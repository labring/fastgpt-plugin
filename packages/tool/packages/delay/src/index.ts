import { addLog } from '@/utils/log';
import { z } from 'zod';

export const InputType = z.object({
  ms: z.number().min(1).max(300000).optional()
});

export const OutputType = z.object({});

export async function tool({
  ms = 1
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  // delay for ms milliseconds
  await new Promise((resolve) => setTimeout(resolve, ms));
  return {};
}
