# Markdown 上传到草稿箱工具设计文档

## 工具概述

`uploadMarkdownToDraft` 工具的主要功能是将 Markdown 格式的内容转换为微信公众号图文消息，并上传到草稿箱。

## 核心功能

### 1. Access Token 智能处理
- **模式一**：直接传入 `accessToken` 参数
- **模式二**：传入 `appId` 和 `appSecret`，工具自动获取 access_token
- 自动优先使用传入的 access_token，未提供时才调用获取函数

### 2. Markdown 转 HTML
- 使用 `marked` 库解析 Markdown 内容
- 使用 `dompurify` 清理 HTML，确保安全性
- 支持标准 Markdown 语法：标题、段落、列表、链接、图片等

### 3. 图片处理
- 提取 Markdown 中的图片链接
- 下载图片并通过微信公众号上传接口上传
- 替换 HTML 中的图片链接为微信 CDN 链接

### 4. 封面图处理
- 支持两种输入：URL 或 media_id
- URL：下载图片并上传为永久素材
- media_id：直接使用，无需上传

### 5. 文章元数据处理
- 标题：支持手动输入或自动提取
- 作者：可选输入
- 摘要：支持手动输入或自动提取
- 原文链接：可选输入
- 评论设置：支持开启/关闭评论，粉丝专属评论

## 输入参数设计

```typescript
interface ToolInput {
  // 认证参数（二选一）
  accessToken?: string;     // 可选：直接提供 access_token
  appId?: string;          // 可选：用于获取 access_token
  appSecret?: string;      // 可选：用于获取 access_token

  // 必需参数
  markdownContent: string; // Markdown 内容
  coverImage: string;      // 封面图 URL 或 media_id

  // 可选参数
  title?: string;          // 文章标题
  author?: string;         // 作者
  digest?: string;         // 文章摘要
  contentSourceUrl?: string; // 原文链接
  needOpenComment?: number;   // 是否开启评论
  onlyFansCanComment?: number; // 仅粉丝评论
}
```

## 技术实现方案

### 1. 依赖包

```json
{
  "dependencies": {
    "zod": "^3.25.76",
    "marked": "^12.0.0",      // Markdown 解析
    "dompurify": "^3.0.8"     // HTML 清理
  },
  "devDependencies": {
    "@types/dompurify": "^3.0.5"  // TypeScript 类型定义
  }
}
```

### 2. Access Token 获取函数

```typescript
import { handleGetAuthToken } from '../../../lib/auth';

async function getAccessToken(appId: string, appSecret: string): Promise<string | null> {
  try {
    const result = await handleGetAuthToken({
      grant_type: 'client_credential',
      appid: appId,
      secret: appSecret
    });

    if ('access_token' in result && result.access_token) {
      return result.access_token;
    }

    return null;
  } catch (error) {
    console.error('获取 access_token 失败:', error);
    return null;
  }
}
```

### 3. 核心函数设计

#### 3.1 Markdown 转 HTML
```typescript
function convertMarkdownToHtml(markdown: string): string {
  const marked = require('marked');
  const DOMPurify = require('dompurify');

  // 配置 marked 选项
  marked.setOptions({
    breaks: true,      // 支持换行
    gfm: true,         // GitHub Flavored Markdown
    sanitize: false    // 我们手动清理
  });

  const rawHtml = marked(markdown);
  return DOMPurify.sanitize(rawHtml);
}
```

#### 3.2 图片链接提取
```typescript
function extractImageUrls(html: string): string[] {
  const imgRegex = /<img[^>]+src="([^"]+)"/g;
  const urls = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}
```

#### 3.3 图片上传处理
```typescript
async function uploadImageToWeChat(
  accessToken: string,
  imageUrl: string
): Promise<string> {
  // 下载图片
  const response = await fetch(imageUrl);
  const imageBuffer = await response.arrayBuffer();
  const imageBlob = new Blob([imageBuffer]);

  // 创建 FormData
  const formData = new FormData();
  formData.append('media', imageBlob, 'image.jpg');
  formData.append('access_token', accessToken);

  // 上传到微信
  const uploadResponse = await fetch(
    'https://api.weixin.qq.com/cgi-bin/media/uploadimg',
    {
      method: 'POST',
      body: formData
    }
  );

  const result = await uploadResponse.json();
  if (result.errcode && result.errcode !== 0) {
    throw new Error(`上传图片失败: ${result.errmsg}`);
  }

  return result.url;
}
```

#### 3.4 封面图处理
```typescript
async function processCoverImage(
  accessToken: string,
  coverImage: string
): Promise<string> {
  // 检查是否为 media_id（通常长度较长且只包含数字字母）
  if (coverImage.length > 20 && /^[a-zA-Z0-9_-]+$/.test(coverImage)) {
    return coverImage; // 已为 media_id
  }

  // 否则作为 URL 处理
  return await uploadImageToWeChat(accessToken, coverImage);
}
```

#### 3.5 标题提取
```typescript
function extractTitle(markdown: string): string | null {
  // 提取第一个 H1 标题
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // 提取第一个 H2 标题
  const h2Match = markdown.match(/^##\s+(.+)$/m);
  if (h2Match) {
    return h2Match[1].trim();
  }

  return null;
}
```

#### 3.6 摘要生成
```typescript
function generateDigest(html: string, maxLength: number = 120): string {
  // 移除 HTML 标签
  const text = html.replace(/<[^>]*>/g, '');

  // 提取前几个句子
  const sentences = text.split(/[。！？.!?]/).filter(s => s.trim());

  let digest = '';
  for (const sentence of sentences) {
    if (digest.length + sentence.length > maxLength) {
      break;
    }
    digest += sentence + '。';
  }

  return digest.trim() || text.substring(0, maxLength) + '...';
}
```

### 4. 主要处理流程

```typescript
export async function tool({
  accessToken, // 可选参数
  appId,       // 必需参数（当 accessToken 未提供时）
  appSecret,   // 必需参数（当 accessToken 未提供时）
  markdownContent,
  coverImage,
  title,
  author,
  digest,
  contentSourceUrl,
  needOpenComment = 0,
  onlyFansCanComment = 0
}: ToolInput): Promise<ToolOutput> {
  try {
    // 1. 获取 access_token
    let token = accessToken;
    if (!token) {
      if (!appId || !appSecret) {
        return {
          error_message: '缺少必要参数：当未提供 accessToken 时，必须提供 appId 和 appSecret'
        };
      }

      // 调用封装好的获取 access_token 函数
      token = await getAccessToken(appId, appSecret);
      if (!token) {
        return {
          error_message: '获取 access_token 失败，请检查 appId 和 appSecret 是否正确'
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

    // 5. 处理文章元数据
    const articleTitle = title || extractTitle(markdownContent) || '未命名文章';
    const articleDigest = digest || generateDigest(processedHtml);

    // 6. 构建文章对象
    const article = {
      title: articleTitle,
      author: author,
      digest: articleDigest,
      content: processedHtml,
      content_source_url: contentSourceUrl,
      thumb_media_id: thumbMediaId,
      need_open_comment: needOpenComment,
      only_fans_can_comment: onlyFansCanComment,
      article_type: 'news'
    };

    // 7. 上传到草稿箱
    const draftResponse = await fetch(
      `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          articles: [article]
        })
      }
    );

    const result = await draftResponse.json();

    if (result.errcode && result.errcode !== 0) {
      return {
        error_message: `上传草稿失败: ${result.errmsg} (错误码: ${result.errcode})`
      };
    }

    return {
      media_id: result.media_id
    };

  } catch (error) {
    return {
      error_message: error instanceof Error
        ? error.message
        : '处理过程中发生未知错误'
    };
  }
}
```

## 输入参数配置更新

需要更新 `config.ts` 文件，增加认证相关的输入参数：

```typescript
inputs: [
  // 认证参数组
  {
    key: 'accessToken',
    label: { 'zh-CN': '访问令牌', en: 'Access Token' },
    description: {
      'zh-CN': '微信公众号 API 访问令牌（可选，与 appId/appSecret 二选一）',
      en: 'WeChat Official Account API access token (optional, choose one with appId/appSecret)'
    },
    renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
    valueType: WorkflowIOValueTypeEnum.string,
    required: false
  },
  {
    key: 'appId',
    label: { 'zh-CN': 'AppID', en: 'AppID' },
    description: {
      'zh-CN': '微信公众号 AppID（当未提供 accessToken 时必需）',
      en: 'WeChat Official Account AppID (required when accessToken not provided)'
    },
    renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
    valueType: WorkflowIOValueTypeEnum.string,
    required: false
  },
  {
    key: 'appSecret',
    label: { 'zh-CN': 'AppSecret', en: 'AppSecret' },
    description: {
      'zh-CN': '微信公众号 AppSecret（当未提供 accessToken 时必需）',
      en: 'WeChat Official Account AppSecret (required when accessToken not provided)'
    },
    renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
    valueType: WorkflowIOValueTypeEnum.string,
    required: false
  },
  // ... 其他参数
]
```

## 错误处理策略

### 1. Access Token 相关错误
- 参数验证：确保提供了足够的认证信息
- Token 获取失败：提供清晰的错误信息
- Token 过期：建议重新获取

### 2. 图片上传失败
- 记录警告日志，但不中断整体流程
- 保持原始图片链接，允许用户手动处理

### 3. 封面图处理失败
- 返回具体错误信息
- 建议用户检查图片 URL 或提供 media_id

### 4. 草稿上传失败
- 返回微信 API 的具体错误信息
- 包含错误码和错误描述

## 使用示例

### 方式一：直接提供 access_token
```typescript
const result = await tool.cb({
  accessToken: 'your_access_token',
  markdownContent: '# 标题\n\n这是一篇**文章**内容。',
  coverImage: 'https://example.com/cover.jpg'
});
```

### 方式二：通过 appId/appSecret 获取
```typescript
const result = await tool.cb({
  appId: 'your_app_id',
  appSecret: 'your_app_secret',
  markdownContent: '# 标题\n\n这是一篇**文章**内容。',
  coverImage: 'https://example.com/cover.jpg'
});
```

### 完整配置示例
```typescript
const result = await tool.cb({
  appId: 'your_app_id',
  appSecret: 'your_app_secret',
  markdownContent: '# 文章标题\n\n这里是文章内容...',
  coverImage: 'https://example.com/cover.jpg',
  title: '自定义标题',
  author: '作者名',
  digest: '文章摘要',
  contentSourceUrl: 'https://example.com/original',
  needOpenComment: 1,
  onlyFansCanComment: 0
});
```

## 配套函数

为了支持 access_token 的智能处理，我们需要在 `lib/auth.ts` 中导出 `handleGetAuthToken` 函数，供这个工具调用。
