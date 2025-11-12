import { z } from 'zod';
import { marked } from 'marked';
import {
  handleGetAuthToken,
  handleUploadImage,
  handleAddDraft,
  handleAddMaterial,
  downloadImageFromUrl
} from '../../../lib/handler';
import { addInlineStyles } from './styles';

export const InputType = z
  .object({
    // 认证参数（二选一）
    accessToken: z.string().optional(),
    appId: z.string().optional(),
    secret: z.string().optional(),

    // 必需参数
    markdownContent: z.string().min(1, 'Markdown 内容不能为空'),
    coverImage: z.string().min(1, '封面图不能为空'),

    // 可选参数
    title: z.string().optional(),
    author: z.string().optional(),
    digest: z.string().optional(),
    contentSourceUrl: z.string().optional(),
    needOpenComment: z.number().optional().default(0),
    onlyFansCanComment: z.number().optional().default(0)
  })
  .refine(
    (data) => {
      // 验证认证参数：要么提供 accessToken，要么同时提供 appId 和 appSecret
      return data.accessToken || (data.appId && data.secret);
    },
    {
      message: '必须提供 accessToken，或者同时提供 appId 和 appSecret',
      path: ['认证参数']
    }
  );

export const OutputType = z.object({
  media_id: z.string().optional(),
  error_message: z.string().optional()
});

export async function tool({
  accessToken,
  appId,
  secret,
  markdownContent,
  coverImage,
  title,
  author,
  digest,
  contentSourceUrl,
  needOpenComment = 0,
  onlyFansCanComment = 0
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
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
        error_message: `获取 access_token 失败: ${errorMsg} (错误码: ${(result as any).errcode})`
      };
    }
  }

  // 2. Markdown 转 HTML
  const html = convertMarkdownToHtml(markdownContent);

  // 3. 提取并处理图片
  const imageUrls = extractImageUrls(html);
  let processedHtml = html;

  for (const imageUrl of imageUrls) {
    try {
      const wechatImageUrl = await uploadImageToWeChat(token, imageUrl);
      processedHtml = processedHtml.replace(imageUrl, wechatImageUrl);
    } catch (error) {
      console.warn(`上传图片失败: ${imageUrl}`, error);
      // 保持原链接，继续处理其他图片
    }
  }

  // 4. 处理封面图
  const thumbMediaId = await processCoverImage(token, coverImage);

  // 5. 构建文章对象
  const article = {
    title: title,
    author: author,
    digest: digest,
    content: processedHtml,
    content_source_url: contentSourceUrl,
    thumb_media_id: thumbMediaId,
    need_open_comment: needOpenComment,
    only_fans_can_comment: onlyFansCanComment,
    article_type: 'news' as const
  };

  // 6. 上传到草稿箱
  const result = await handleAddDraft({
    access_token: token,
    articles: [article]
  });

  return {
    media_id: result.media_id
  };
}

/**
 * Markdown 转 HTML
 */
function convertMarkdownToHtml(markdown: string): string {
  // 配置 marked 选项
  marked.setOptions({
    breaks: true, // 支持换行
    gfm: true // GitHub Flavored Markdown
  });

  // 解析 Markdown 为 HTML
  const rawHtml = marked.parse(markdown) as string;

  // 清理 HTML 并添加内联样式，适用于微信公众号环境
  return sanitizeAndAddStyles(rawHtml);
}

/**
 * 清理 HTML 并添加内联样式
 */
function sanitizeAndAddStyles(html: string): string {
  // 移除微信不支持的脚本标签
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 移除危险的事件处理器属性
  html = html.replace(/\s*on\w+="[^"]*"/gi, '');

  // 移除 javascript: 协议
  html = html.replace(/javascript:/gi, '');

  // 移除微信不支持的标签，保留基本格式化标签
  const unsupportedTags = [
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'button',
    'select',
    'textarea',
    'style'
  ];
  unsupportedTags.forEach((tag) => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis');
    html = html.replace(regex, '');
  });

  // 添加内联样式
  return addInlineStyles(html);
}

/**
 * 提取图片链接
 */
function extractImageUrls(html: string): string[] {
  const imgRegex = /<img[^>]+src="([^"]+)"/g;
  const urls = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}

/**
 * 上传图片到微信（临时素材）
 */
async function uploadImageToWeChat(accessToken: string, imageUrl: string): Promise<string> {
  try {
    // 使用统一的图片下载方法
    const imageBlob = await downloadImageFromUrl(imageUrl, 'image.jpg', 'image/jpeg');

    const result = await handleUploadImage({
      access_token: accessToken,
      media: imageBlob
    });

    if ('errcode' in result && result.errcode !== 0) {
      const errorMsg = (result as any).errmsg || '未知错误';
      throw new Error(`上传图片失败: ${errorMsg} (错误码: ${result.errcode})`);
    }

    return result.url;
  } catch (error) {
    throw new Error(
      `上传图片失败: ${imageUrl} - ${error instanceof Error ? error.message : '未知错误'}`
    );
  }
}

/**
 * 处理封面图（上传为永久素材）
 */
async function processCoverImage(accessToken: string, coverImage: string): Promise<string> {
  // 检查是否为 media_id（通常长度较长且只包含数字字母下划线）
  if (coverImage.length > 20 && /^[a-zA-Z0-9_-]+$/.test(coverImage)) {
    return coverImage; // 已为 media_id
  }

  try {
    // 使用统一的图片下载方法
    const imageBlob = await downloadImageFromUrl(coverImage, 'cover.jpg', 'image/jpeg');

    const result = await handleAddMaterial({
      access_token: accessToken,
      type: 'image',
      media: imageBlob
    });

    if ('errcode' in result && result.errcode !== 0) {
      const errorMsg = (result as any).errmsg || '未知错误';
      throw new Error(`上传封面图失败: ${errorMsg} (错误码: ${result.errcode})`);
    }

    return result.media_id; // 返回永久素材的 media_id
  } catch (error) {
    throw new Error(
      `处理封面图失败: ${coverImage} - ${error instanceof Error ? error.message : '未知错误'}`
    );
  }
}
