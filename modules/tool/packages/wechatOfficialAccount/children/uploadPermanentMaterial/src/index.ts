import { z } from 'zod';
import { handleGetAuthToken, handleAddMaterial } from '../../../lib/handler';
import { addLog } from '@/utils/log';

export const InputType = z
  .object({
    // 认证参数（二选一）
    accessToken: z.string().optional(),
    appId: z.string().optional(),
    secret: z.string().optional(),

    // 必需参数
    type: z.enum(['image', 'voice', 'video']),
    mediaUrl: z.string().url('请提供有效的文件URL'),

    // 可选参数（视频素材需要）
    title: z.string().optional(),
    introduction: z.string().optional()
  })
  .refine(
    (data) => {
      // 验证认证参数：要么提供 accessToken，要么同时提供 appId 和 secret
      return data.accessToken || (data.appId && data.secret);
    },
    {
      message: '必须提供 accessToken，或者同时提供 appId 和 appSecret',
      path: ['认证参数']
    }
  )
  .refine(
    (data) => {
      // 对于视频类型，title 和 introduction 是必需的
      if (data.type === 'video') {
        return !!(data.title && data.introduction);
      }
      return true;
    },
    {
      message: '视频素材必须提供标题和简介',
      path: ['视频参数']
    }
  );

export const OutputType = z.object({
  media_id: z.string().optional(),
  url: z.string().optional(),
  success: z.boolean(),
  message: z.string().optional(),
  error_message: z.string().optional()
});

// Helper function to get MIME type from file extension
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',
    mp3: 'audio/mpeg',
    amr: 'audio/amr',
    mp4: 'video/mp4',
    m4v: 'video/mp4'
  };
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

// Helper function to get file extension for specific material type
function getFileExtensionForType(type: string, originalExtension?: string): string {
  switch (type) {
    case 'voice':
      return 'amr';
    case 'thumb':
      return 'jpg';
    case 'video':
      return 'mp4';
    case 'image':
    default:
      return originalExtension || 'jpg';
  }
}

// Helper function to download file from URL and create File object
async function downloadFileFromUrl(mediaUrl: string, type: string): Promise<File> {
  try {
    const response = await fetch(mediaUrl);
    if (!response.ok) {
      throw new Error(`下载文件失败: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const urlPath = new URL(mediaUrl).pathname;
    const originalExtension = urlPath.split('.').pop() || '';
    const extension = getFileExtensionForType(type, originalExtension);
    const filename = `file.${extension}`;

    return new File([arrayBuffer], filename, { type: getMimeType(extension) });
  } catch (error) {
    throw new Error(`下载文件失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function tool({
  accessToken,
  appId,
  secret,
  type,
  mediaUrl,
  title,
  introduction
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    // 1. 获取 access_token
    let token = accessToken;
    if (!token) {
      const result = await handleGetAuthToken({
        grant_type: 'client_credential',
        appid: appId!,
        secret: secret!
      });

      if ('access_token' in result && result.access_token) {
        token = result.access_token;
      } else {
        const errorMsg = (result as any).errmsg || '未知错误';
        return {
          success: false,
          error_message: `获取 access_token 失败: ${errorMsg} (错误码: ${(result as any).errcode})`
        };
      }
    }

    // 3. 准备上传参数
    const uploadParams: any = {
      access_token: token,
      type: type
    };

    // 4. 为视频类型添加描述信息
    if (type === 'video') {
      uploadParams.description = {
        title: title!,
        introduction: introduction!
      };
    }

    // 5. 调用微信 API 上传永久素材
    const result = await handleAddMaterial({
      access_token: token,
      type: type,
      description: {
        title: title!,
        introduction: introduction!
      },
      media: await downloadFileFromUrl(mediaUrl, type)
    });

    addLog.debug(`Upload permanent material result: ${JSON.stringify(result, null, 2)}`);

    return {
      success: true,
      media_id: result.media_id,
      url: result.url, // 仅图片类型返回
      message: '永久素材上传成功'
    };
  } catch (error) {
    return {
      success: false,
      error_message: `上传失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
