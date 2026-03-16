import { z } from 'zod';

export const InputType = z.object({
  endpoint: z.string().min(1, 'Endpoint is required'),
  apiKey: z.string().min(1, 'API key is required'),
  model: z.enum(['FLUX-1.1-pro', 'FLUX-2-pro']).default('FLUX-1.1-pro'),
  prompt: z.string().min(1, 'Prompt cannot be empty'),
  width: z.number().int().min(256).max(2048).default(1024),
  height: z.number().int().min(256).max(2048).default(1024),
  inputImages: z.array(z.string()).max(2).optional(),
  safetyTolerance: z.number().int().min(0).max(5).default(2)
});

export const OutputType = z.object({
  b64Json: z.string(),
  cost: z.number()
});

/** 像素数向上取整到整 MP */
function ceilMP(pixels: number): number {
  return Math.ceil(pixels / 1_000_000);
}

/**
 * 从 base64 原始数据解析图片宽高（支持 PNG / JPEG）
 * 解析失败返回 null
 */
export function getImageDimensions(b64: string): { width: number; height: number } | null {
  try {
    const buf = Buffer.from(b64, 'base64');

    // PNG: 文件头 \x89PNG，宽度在偏移 16，高度在偏移 20（各 4 字节大端）
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }

    // JPEG: 文件头 FF D8，扫描 SOF 标记获取尺寸
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i + 3 < buf.length) {
        if (buf[i] !== 0xff) break;
        const marker = buf[i + 1];
        const isSOF =
          (marker >= 0xc0 && marker <= 0xc3) ||
          (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) ||
          (marker >= 0xcd && marker <= 0xcf);
        if (isSOF) {
          return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
        }
        const segLen = buf.readUInt16BE(i + 2);
        i += 2 + segLen;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 计算本次请求总费用（USD）
 *
 * FLUX-1.1-pro 输出: $0.04 / 张（固定）
 * FLUX-2-pro 输出:   首 MP $0.03，后续每 MP $0.015（不足 1MP 按 1MP 计）
 * FLUX-2-pro 输入图片: $0.015 / MP（不足 1MP 按 1MP 计，无法解析尺寸则跳过）
 */
export function calcCost({
  model,
  width,
  height,
  resolvedImages
}: {
  model: string;
  width: number;
  height: number;
  resolvedImages?: string[];
}): number {
  if (model === 'FLUX-1.1-pro') return 0.04;

  const outputMP = ceilMP(width * height);
  const outputCost = 0.03 + Math.max(0, outputMP - 1) * 0.015;

  const inputCost = (resolvedImages ?? []).reduce((sum, img) => {
    const dims = getImageDimensions(img);
    return dims ? sum + ceilMP(dims.width * dims.height) * 0.015 : sum;
  }, 0);

  return outputCost + inputCost;
}

/**
 * 将图片输入统一转为纯 base64 字符串
 * - http/https URL（FastGPT 上传后的 S3 链接）→ fetch 下载转 base64
 * - data:... 前缀 → 去掉前缀取 base64 部分
 * - 其他 → 视为已是纯 base64，直接返回
 */
async function resolveToBase64(input: string): Promise<string> {
  if (input.startsWith('http://') || input.startsWith('https://')) {
    const res = await fetch(input);
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.toString('base64');
  }
  if (input.startsWith('data:')) {
    return input.split(',')[1] ?? input;
  }
  return input;
}

export async function tool({
  endpoint,
  apiKey,
  model,
  prompt,
  width,
  height,
  inputImages,
  safetyTolerance
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const baseUrl = endpoint.replace(/\/$/, '');

  const resolvedImages = inputImages?.length
    ? await Promise.all(inputImages.map(resolveToBase64))
    : undefined;

  const { url, body } =
    model === 'FLUX-2-pro'
      ? {
          url: `${baseUrl}/providers/blackforestlabs/v1/flux-2-pro?api-version=preview`,
          body: {
            model: 'FLUX.2-pro',
            prompt,
            width,
            height,
            n: 1,
            safety_tolerance: safetyTolerance,
            ...(resolvedImages?.[0] && { input_image: resolvedImages[0] }),
            ...(resolvedImages?.[1] && { input_image_2: resolvedImages[1] })
          }
        }
      : {
          url: `${baseUrl}/openai/deployments/FLUX-1.1-pro/images/generations?api-version=2025-04-01-preview`,
          body: {
            model: 'FLUX-1.1-pro',
            prompt,
            n: 1,
            safety_tolerance: safetyTolerance
          }
        };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Azure API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { data: Array<{ b64_json: string }> };
  const b64Json = data.data?.[0]?.b64_json;

  if (!b64Json) {
    throw new Error('No image data returned from Azure API');
  }

  return { b64Json, cost: calcCost({ model, width, height, resolvedImages }) };
}
