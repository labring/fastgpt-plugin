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

// 辅助函数：解析字符串或字符串数组，支持 JSON 编码的数组
function parseStringOrArray(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map((item) => String(item));
  }

  if (typeof val === 'string') {
    // 尝试解析 JSON 数组
    if (val.trim().startsWith('[') && val.trim().endsWith(']')) {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item));
        }
      } catch {
        // JSON 解析失败，当作普通字符串处理
      }
    }
    return [val];
  }

  // 其他类型转为字符串
  return [String(val)];
}

// 辅助类型：支持字符串或字符串数组（用于输入验证）
const StringOrArray = z.union([z.string(), z.array(z.string())]);

// 辅助类型：支持数字、字符串(可解析为数字)或它们的数组
const NumberOrStringArray = z
  .union([z.number(), z.string(), z.array(z.union([z.number(), z.string()]))])
  .transform((val) => {
    if (Array.isArray(val)) {
      return val.map((item) => (typeof item === 'string' ? parseInt(item, 10) : item));
    }
    return typeof val === 'string' ? parseInt(val, 10) : val;
  });

export const InputType = z
  .object({
    // 认证参数（二选一）
    accessToken: z.string().optional(),
    appId: z.string().optional(),
    secret: z.string().optional(),

    // 必需参数 - 支持单个或多个
    markdownContent: StringOrArray.refine(
      (val) => {
        if (Array.isArray(val)) {
          return val.length > 0 && val.every((content) => content.trim().length > 0);
        }
        return val.trim().length > 0;
      },
      { message: 'Markdown 内容不能为空' }
    ),
    coverImage: StringOrArray.refine(
      (val) => {
        if (Array.isArray(val)) {
          return val.length > 0 && val.every((img) => img.trim().length > 0);
        }
        return val.trim().length > 0;
      },
      { message: '封面图不能为空' }
    ),

    // 可选参数 - 支持单个或多个
    title: StringOrArray.optional(),
    author: StringOrArray.optional(),
    digest: StringOrArray.optional(),
    contentSourceUrl: StringOrArray.optional(),
    needOpenComment: NumberOrStringArray.optional().default(0),
    onlyFansCanComment: NumberOrStringArray.optional().default(0)
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

  // 2. 解析输入为数组格式（支持 JSON 编码的数组）
  const markdownContents = parseStringOrArray(markdownContent);
  const coverImages = parseStringOrArray(coverImage);
  const titles = title ? parseStringOrArray(title) : undefined;
  const authors = author ? parseStringOrArray(author) : undefined;
  const digests = digest ? parseStringOrArray(digest) : undefined;
  const contentSourceUrls = contentSourceUrl ? parseStringOrArray(contentSourceUrl) : undefined;
  const needOpenComments = Array.isArray(needOpenComment) ? needOpenComment : [needOpenComment];
  const onlyFansCanComments = Array.isArray(onlyFansCanComment)
    ? onlyFansCanComment
    : [onlyFansCanComment];

  // 3. 验证数组长度一致性
  const articleCount = markdownContents.length;

  if (coverImages.length !== articleCount && coverImages.length !== 1) {
    return {
      error_message: `封面图数量必须与 Markdown 内容数量一致，或提供一个通用封面图。封面图: ${coverImages.length}, 文章: ${articleCount}`
    };
  }

  if (titles && titles.length !== articleCount && titles.length !== 1) {
    return {
      error_message: `标题数量必须与 Markdown 内容数量一致，或提供一个通用标题。标题: ${titles.length}, 文章: ${articleCount}`
    };
  }

  // 4. 批量处理每篇文章
  const articles = [];

  for (let i = 0; i < articleCount; i++) {
    try {
      // 获取当前文章的配置（支持数组长度为1时的复用）
      const currentMarkdown = markdownContents[i];
      const currentCoverImage = coverImages.length === 1 ? coverImages[0] : coverImages[i];
      const currentTitle = titles ? (titles.length === 1 ? titles[0] : titles[i]) : undefined;
      const currentAuthor = authors ? (authors.length === 1 ? authors[0] : authors[i]) : undefined;
      const currentDigest = digests ? (digests.length === 1 ? digests[0] : digests[i]) : undefined;
      const currentContentSourceUrl = contentSourceUrls
        ? contentSourceUrls.length === 1
          ? contentSourceUrls[0]
          : contentSourceUrls[i]
        : undefined;
      const currentNeedOpenComment =
        needOpenComments.length === 1 ? needOpenComments[0] : needOpenComments[i];
      const currentOnlyFansCanComment =
        onlyFansCanComments.length === 1 ? onlyFansCanComments[0] : onlyFansCanComments[i];

      // 处理单篇 markdown
      const processedArticle = await processSingleArticle({
        token,
        markdownContent: currentMarkdown,
        coverImage: currentCoverImage,
        title: currentTitle,
        author: currentAuthor,
        digest: currentDigest,
        contentSourceUrl: currentContentSourceUrl,
        needOpenComment: currentNeedOpenComment,
        onlyFansCanComment: currentOnlyFansCanComment
      });

      articles.push(processedArticle);
    } catch (error) {
      return {
        error_message: `处理第 ${i + 1} 篇文章失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  // 5. 批量上传到草稿箱
  try {
    const result = await handleAddDraft({
      access_token: token,
      articles: articles
    });

    return {
      media_id: result.media_id
    };
  } catch (error) {
    return {
      error_message: `批量上传草稿失败: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}

/**
 * 处理单篇文章的辅助函数
 */
async function processSingleArticle({
  token,
  markdownContent,
  coverImage,
  title,
  author,
  digest,
  contentSourceUrl,
  needOpenComment = 0,
  onlyFansCanComment = 0
}: {
  token: string;
  markdownContent: string;
  coverImage: string;
  title?: string;
  author?: string;
  digest?: string;
  contentSourceUrl?: string;
  needOpenComment?: number;
  onlyFansCanComment?: number;
}) {
  // 1. Markdown 转 HTML
  const html = convertMarkdownToHtml(markdownContent);

  // 2. 提取并处理图片
  const imageUrls = extractImageUrls(html);
  let processedHtml = html;

  for (const imageUrl of imageUrls) {
    try {
      const wechatImageUrl = await uploadImageToWeChat(token, imageUrl);
      // HTML 中的 URL 是编码后的（& 变成 &amp;），所以替换时也需要使用编码后的 URL
      const encodedUrl = imageUrl
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      // 使用正则表达式全局替换，确保同一图片 URL 的所有出现都被替换
      const escapedUrl = encodedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      processedHtml = processedHtml.replace(new RegExp(escapedUrl, 'g'), wechatImageUrl);
    } catch (error) {
      console.warn(`上传图片失败: ${imageUrl}`, error);
      // 保持原链接，继续处理其他图片
    }
  }

  // 3. 处理封面图
  const thumbMediaId = await processCoverImage(token, coverImage);

  // 4. 构建文章对象
  return {
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
 * 注意：HTML 中的 & 会被转义为 &amp;，需要解码
 */
function extractImageUrls(html: string): string[] {
  const imgRegex = /<img[^>]+src="([^"]+)"/g;
  const urls = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    // 解码 HTML 实体，将 &amp; 转回 &
    const decodedUrl = match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    urls.push(decodedUrl);
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
