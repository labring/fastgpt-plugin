import { z } from 'zod';
import { getErrText } from '@tool/utils/err';
import { uploadFile } from '@tool/utils/uploadFile';
import { POST } from '@tool/utils/request';

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
  error: z.string().optional(), // 兼容旧版的错误信息
  图片访问链接: z.string().optional(), // 兼容旧版的图片访问链接
  system_error: z.string().optional(),
  link: z.string().optional()
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { prompt, url, authorization, 绘图提示词: old_prompt } = props;

  try {
    const { data } = await POST<{
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
      return Promise.reject('Request failed');
    }

    const uploadResult = await uploadFile({
      url: imageUrl,
      defaultFilename: 'dalle3.png'
    });

    if (old_prompt) {
      return {
        图片访问链接: uploadResult.accessUrl
      };
    } else {
      return {
        link: uploadResult.accessUrl
      };
    }
  } catch (error: any) {
    const errorMessage = getErrText(error);

    if (old_prompt) {
      return {
        error: errorMessage
      };
    }

    return Promise.reject({
      system_error: errorMessage
    });
  }
}
