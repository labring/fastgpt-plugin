import { z } from 'zod';
import axios from 'axios';
import { getErrText } from '@tool/utils/err';

export const InputType = z
  .object({
    绘图提示词: z.string().optional(), //绘图提示词是旧版的名称，保持兼容性
    prompt: z.string().optional(),
    url: z.string(),
    authorization: z.string()
  })
  .refine(
    (data) => {
      return data.绘图提示词 || data.prompt;
    },
    {
      message: '必须传入 "绘图提示词" 或 "prompt" 中的一个'
    }
  )
  .transform((data) => ({
    ...data,
    prompt: data.prompt || data.绘图提示词
  }));
export const OutputType = z.object({
  错误信息: z.string().optional(), // 兼容旧版的错误信息
  图片访问链接: z.string().optional(), // 兼容旧版的图片访问链接
  system_error: z.string().optional(),
  link: z.string().optional()
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { prompt, url, authorization } = props;

  try {
    const { data } = await axios.post<{
      data: { url: string }[];
    }>(
      `${url}/v1/images/generations`,
      {
        model: 'dall-e-3',
        n: 1,
        size: '1024x1024',
        prompt
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authorization}`
        }
      }
    );

    const imageUrl = data?.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('Request failed');
    }

    return {
      图片访问链接: imageUrl,
      link: imageUrl
    };
  } catch (error: any) {
    return {
      错误信息: getErrText(error),
      system_error: getErrText(error)
    };
  }
}
