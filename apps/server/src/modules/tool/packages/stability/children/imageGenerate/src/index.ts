import { z } from 'zod';
import { uploadFile } from '@tool/utils/uploadFile';
import axios from 'axios';
import FormData from 'form-data';

// 模型类型定义
const ModelEnum = z.enum(['ultra', 'core', 'sd3.5-large', 'sd3.5-large-turbo', 'sd3.5-medium']);
type ModelType = z.infer<typeof ModelEnum>;

// 输入类型定义
export const InputType = z.object({
  STABILITY_KEY: z.string().min(1, 'STABILITY_KEY is required'),
  prompt: z.string().min(1, 'Prompt cannot be empty'),
  model: ModelEnum,
  aspect_ratio: z
    .enum(['1:1', '16:9', '21:9', '2:3', '3:2', '4:5', '5:4', '9:16', '9:21'])
    .optional()
    .default('1:1'),
  negative_prompt: z.string().optional(),
  style_preset: z
    .enum([
      '3d-model',
      'analog-film',
      'anime',
      'cinematic',
      'comic-book',
      'digital-art',
      'enhance',
      'fantasy-art',
      'isometric',
      'line-art',
      'low-poly',
      'modeling-compound',
      'neon-punk',
      'origami',
      'photographic',
      'pixel-art',
      'tile-texture'
    ])
    .optional(),
  seed: z.number().int().min(0).max(4294967294).optional(),
  output_format: z.enum(['png', 'jpeg', 'webp']).optional().default('webp')
});

// 输出类型定义
export const OutputType = z.object({
  link: z.string()
});

// 根据模型获取 API 端点
function getApiEndpoint(model: ModelType): string {
  const baseUrl = 'https://api.stability.ai/v2beta/stable-image/generate';

  if (model === 'ultra') {
    return `${baseUrl}/ultra`;
  } else if (model === 'core') {
    return `${baseUrl}/core`;
  } else {
    // sd3.5 系列模型
    return `${baseUrl}/sd3`;
  }
}

// 工具主函数
export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { STABILITY_KEY, model, output_format } = props;

  // 获取 API 端点
  const endpoint = getApiEndpoint(model);

  // 使用 axios 发送流式请求，设置更长的超时时间
  const response = await axios.postForm(
    endpoint,
    axios.toFormData(
      {
        prompt: props.prompt,
        output_format: props.output_format,
        aspect_ratio: props.aspect_ratio,
        negative_prompt: props.negative_prompt,
        style_preset: props.style_preset,
        seed: props.seed
      },
      new FormData()
    ),
    {
      headers: {
        Authorization: `Bearer ${STABILITY_KEY}`,
        Accept: 'image/*'
      },
      validateStatus: undefined,
      responseType: 'arraybuffer',
      timeout: 360000
    }
  );
  if (response.status !== 200) {
    return Promise.reject(`${response.status}: ${response.data.toString()}`);
  }

  // 上传文件
  const uploadResult = await uploadFile({
    buffer: Buffer.from(response.data),
    defaultFilename: `${model}.${output_format}`
  });

  // 返回结果
  return {
    link: uploadResult.accessUrl
  };
}
