import { addLog } from '@/utils/log.js';
import { OffiAccountURL } from './api.js';
import type { OffiAccountAPIType, WeChatError } from './api.js';

// ===== 工具函数 =====

/**
 * 从 URL 下载图片并创建 File 对象
 * @param imageUrl 图片 URL
 * @param filename 可选文件名，默认为 'image.jpg'
 * @param mimeType 可选 MIME 类型，默认为 'image/jpeg'
 * @returns Promise<File> 返回 File 对象
 */
export async function downloadImageFromUrl(
  imageUrl: string,
  filename: string = 'image.jpg',
  mimeType: string = 'image/jpeg'
): Promise<File> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.statusText} (${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();

    addLog.debug(
      `Successfully downloaded image from ${imageUrl}, size: ${arrayBuffer.byteLength} bytes`
    );

    return new File([arrayBuffer], filename, { type: mimeType });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    addLog.error(`Failed to download image from ${imageUrl}: ${errorMessage}`);
    throw new Error(`图片下载失败: ${imageUrl} - ${errorMessage}`);
  }
}

// 微信 API 响应的通用包装类型
type WeChatApiResponse<T> = T & WeChatError;

/**
 * 通用的微信 API 调用函数
 */
async function callWeChatAPI<T extends Record<string, any>>(
  url: string,
  method: string,
  accessToken?: string,
  body?: BodyInit | null,
  headers?: Record<string, string>
): Promise<T> {
  try {
    const fullUrl = accessToken ? `${url}?access_token=${accessToken}` : url;

    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body
    });

    const result = (await response.json()) as WeChatApiResponse<T>;

    // 检查微信 API 错误
    if (result.errcode && result.errcode !== 0) {
      const error = new WeChatAPIError(result.errmsg || '未知错误', result.errcode);
      throw error;
    }

    return result as T;
  } catch (error) {
    if (error instanceof WeChatAPIError) {
      throw error;
    }

    // 处理网络错误或其他异常
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw new Error(`API 调用失败: ${errorMessage}`);
  }
}

/**
 * 自定义微信 API 错误类
 */
export class WeChatAPIError extends Error {
  constructor(
    message: string,
    public readonly errcode: number,
    public readonly errmsg?: string
  ) {
    super(message);
    this.name = 'WeChatAPIError';
  }
}

// GET 请求 - 参数通过 query string 传递
async function callGetAPI<T extends Record<string, any>>(
  url: string,
  params: Record<string, string | number>
): Promise<T> {
  const queryString = new URLSearchParams(
    Object.entries(params).reduce(
      (acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>
    )
  ).toString();

  return callWeChatAPI<T>(`${url}?${queryString}`, 'get');
}

// POST 请求 - access_token 在 query，其他参数在 body（JSON）
async function callPostJSON<T extends Record<string, any>>(
  url: string,
  accessToken: string,
  data: any
): Promise<T> {
  return callWeChatAPI<T>(url, 'post', accessToken, JSON.stringify(data));
}

// POST 请求 - access_token 在 query，其他参数在 body（FormData）
async function callPostFormData<T extends Record<string, any>>(
  url: string,
  accessToken: string,
  formData: FormData
): Promise<T> {
  return callWeChatAPI<T>(url, 'post', accessToken, formData, {
    'Content-Type': 'multipart/form-data'
  });
}

// ===== 认证接口 =====

export async function handleGetAuthToken(
  params: OffiAccountAPIType['getAuthToken']['req']
): Promise<OffiAccountAPIType['getAuthToken']['res']> {
  const { url } = OffiAccountURL.getAuthToken;
  return callGetAPI(url, params);
}

// ===== 素材接口 =====

export async function handleUploadImage(
  params: OffiAccountAPIType['uploadImage']['req']
): Promise<OffiAccountAPIType['uploadImage']['res']> {
  const { url } = OffiAccountURL.uploadImage;
  const formData = new FormData();
  formData.append('media', params.media);

  return callPostFormData(url, params.access_token, formData);
}

export async function handleAddMaterial(
  params: OffiAccountAPIType['addMaterial']['req']
): Promise<OffiAccountAPIType['addMaterial']['res']> {
  const { url } = OffiAccountURL.addMaterial;
  const formData = new FormData();
  formData.append('media', params.media);

  if (params.description) {
    formData.append('description', JSON.stringify(params.description));
  }

  // type should be query parameter, not form data
  const fullUrl = `${url}?access_token=${params.access_token}&type=${params.type}`;
  return callPostFormData(fullUrl, params.access_token, formData);
}

export async function handleGetMaterial(
  params: OffiAccountAPIType['getMaterial']['req']
): Promise<OffiAccountAPIType['getMaterial']['res']> {
  const { url } = OffiAccountURL.getMaterial;

  // Use unified API call for consistency
  const result = await callPostJSON(url, params.access_token, {
    media_id: params.media_id
  });

  return result as OffiAccountAPIType['getMaterial']['res'];
}

export async function handleBatchGetMaterial(
  params: OffiAccountAPIType['batchGetMaterial']['req']
): Promise<OffiAccountAPIType['batchGetMaterial']['res']> {
  const { url } = OffiAccountURL.batchGetMaterial;
  return callPostJSON(url, params.access_token, {
    type: params.type,
    offset: params.offset,
    count: params.count
  });
}

export async function handleDeleteMaterial(
  params: OffiAccountAPIType['deleteMaterial']['req']
): Promise<OffiAccountAPIType['deleteMaterial']['res']> {
  const { url } = OffiAccountURL.deleteMaterial;
  return callPostJSON(url, params.access_token, {
    media_id: params.media_id
  });
}

// ===== 草稿接口 =====

export async function handleAddDraft(
  params: OffiAccountAPIType['addDraft']['req']
): Promise<OffiAccountAPIType['addDraft']['res']> {
  const { url } = OffiAccountURL.addDraft;
  return callPostJSON(url, params.access_token, {
    articles: params.articles
  });
}

export async function handleUpdateDraft(
  params: OffiAccountAPIType['updateDraft']['req']
): Promise<OffiAccountAPIType['updateDraft']['res']> {
  const { url } = OffiAccountURL.updateDraft;
  return callPostJSON(url, params.access_token, {
    media_id: params.media_id,
    index: params.index,
    articles: params.articles
  });
}

export async function handleGetDraft(
  params: OffiAccountAPIType['getDraft']['req']
): Promise<OffiAccountAPIType['getDraft']['res']> {
  const { url } = OffiAccountURL.getDraft;
  return callPostJSON(url, params.access_token, {
    media_id: params.media_id
  });
}

export async function handleDeleteDraft(
  params: OffiAccountAPIType['deleteDraft']['req']
): Promise<OffiAccountAPIType['deleteDraft']['res']> {
  const { url } = OffiAccountURL.deleteDraft;
  return callPostJSON(url, params.access_token, {
    media_id: params.media_id
  });
}

export async function handleBatchGetDraft(
  params: OffiAccountAPIType['batchGetDraft']['req']
): Promise<OffiAccountAPIType['batchGetDraft']['res']> {
  const { url } = OffiAccountURL.batchGetDraft;

  const body: any = {
    offset: params.offset,
    count: params.count
  };

  if (params.no_content !== undefined) {
    body.no_content = params.no_content;
  }

  return callPostJSON(url, params.access_token, body);
}

export async function handleDraftSwitch(
  params: OffiAccountAPIType['draftSwitch']['req']
): Promise<OffiAccountAPIType['draftSwitch']['res']> {
  const { url } = OffiAccountURL.draftSwitch;

  const body: any = {};
  if (params.checkonly !== undefined) {
    body.checkonly = params.checkonly;
  }

  return callPostJSON(url, params.access_token, body);
}

// ===== 发布接口 =====

export async function handleSubmitPublish(
  params: OffiAccountAPIType['submitPublish']['req']
): Promise<OffiAccountAPIType['submitPublish']['res']> {
  const { url } = OffiAccountURL.submitPublish;
  return callPostJSON(url, params.access_token, {
    media_id: params.media_id
  });
}

export async function handleDeletePublished(
  params: OffiAccountAPIType['deletePublished']['req']
): Promise<OffiAccountAPIType['deletePublished']['res']> {
  const { url } = OffiAccountURL.deletePublished;

  const body: any = {
    article_id: params.article_id
  };

  if (params.index !== undefined) {
    body.index = params.index;
  }

  return callPostJSON(url, params.access_token, body);
}

export async function handleBatchGetPublished(
  params: OffiAccountAPIType['batchGetPublished']['req']
): Promise<OffiAccountAPIType['batchGetPublished']['res']> {
  const { url } = OffiAccountURL.batchGetPublished;

  const body: any = {
    offset: params.offset,
    count: params.count
  };

  if (params.no_content !== undefined) {
    body.no_content = params.no_content;
  }

  return callPostJSON(url, params.access_token, body);
}

export async function handleGetPublishStatus(
  params: OffiAccountAPIType['getPublishStatus']['req']
): Promise<OffiAccountAPIType['getPublishStatus']['res']> {
  const { url } = OffiAccountURL.getPublishStatus;
  return callPostJSON(url, params.access_token, {
    publish_id: params.publish_id
  });
}

export async function handleGetPublishedArticle(
  params: OffiAccountAPIType['getPublishedArticle']['req']
): Promise<OffiAccountAPIType['getPublishedArticle']['res']> {
  const { url } = OffiAccountURL.getPublishedArticle;
  return callPostJSON(url, params.access_token, {
    article_id: params.article_id
  });
}
