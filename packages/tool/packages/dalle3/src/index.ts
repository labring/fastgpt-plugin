import { z } from 'zod';

export const InputType = z.object({
  绘图提示词: z.string(),
  url: z.string(),
  authorization: z.string()
});

export const OutputType = z.object({
  错误信息: z.string().optional(),
  图片访问链接: z.string().optional()
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { 绘图提示词, url, authorization } = props;
  const res = await fetch(`${url}/v1/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authorization}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      n: 1,
      size: '1024x1024',
      prompt: 绘图提示词
    })
  });
  if (!res.ok) {
    const error = await res.text();
    return {
      错误信息: error
    };
  }
  const json = await res.json();
  return {
    图片访问链接: json.data[0].url
  };
}
