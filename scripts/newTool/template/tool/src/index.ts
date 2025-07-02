import { format } from 'date-fns';
import { z } from 'zod';

export const InputType = z.object({
  apiKey: z.string(),
  formatStr: z.string().optional().default('yyyy-MM-dd HH:mm:ss')
});

export const OutputType = z.object({
  time: z.string()
});

export async function tool({
  apiKey,
  formatStr
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  // 请求数据
  // const result = await fetch('https://api.example.com/data', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     apiKey
  //   })
  // });

  return {
    time: format(new Date(), formatStr)
  };
}
