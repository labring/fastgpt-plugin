import { z } from 'zod';
import JSZip from 'jszip';
import { delay } from '@tool/utils/delay';
import { uploadFile } from '@tool/utils/uploadFile';

export const InputType = z.object({
  base_url: z.string(),
  token: z.string(),
  files: z.array(z.string()),
  is_ocr: z.boolean().optional().default(false),
  enable_formula: z.boolean().optional().default(true),
  enable_table: z.boolean().optional().default(true),
  language: z.string().optional().default('ch'),
  extra_formats: z.array(z.string()).optional().default([]),
  model_version: z.string().optional().default('pipeline')
});

export const OutputType = z.object({
  result: z.array(
    z.object({
      content: z.string(),
      content_list: z.array(z.any()),
      images: z.record(z.string()),
      docx: z.string().optional(),
      html: z.string().optional(),
      latex_content: z.string().optional()
    })
  )
});

interface FileType {
  is_ocr: boolean;
  url: string;
  data_id?: string;
}

interface BatchPayloadType {
  enable_formula: boolean;
  enable_table: boolean;
  language: string;
  model_version: string;
  extra_formats: string[];
  files: FileType[];
}

interface ApiResponseDataType<T extends Record<string, unknown>> {
  code:
    | 0
    | 'A0202'
    | 'A0211'
    | '-500'
    | '-10001'
    | '-10002'
    | '-60001'
    | '-60002'
    | '-60003'
    | '-60004'
    | '-60005'
    | '-60006'
    | '-60007'
    | '-60008'
    | '-60009'
    | '-60010'
    | '-60011'
    | '-60012'
    | '-60013'
    | '-60014'
    | '-60015'
    | '-60016';
  msg: string;
  trace_id: string;
  data: T;
}

type BatchResponseDataType = ApiResponseDataType<{
  batch_id: string;
}>;

interface ExtractProgressType {
  extracted_pages: number;
  start_time: string;
  total_pages: number;
}

interface ExtractResultItemType {
  file_name: string;
  state: 'done' | 'waiting-file' | 'pending' | 'running' | 'failed' | 'converting';
  full_zip_url: string;
  err_msg: string;
  data_id?: string;
  extract_progress?: ExtractProgressType;
}

type ExtractBatchType = ApiResponseDataType<{
  batch_id: string;
  extract_result: ExtractResultItemType[];
}>;

interface ExtracResultType {
  content: string;
  content_list: any[];
  images: Record<string, string>;
  docx?: string;
  html?: string;
  latex_content?: string;
}

type PropsType = z.infer<typeof InputType>;
interface InnerPropsType extends PropsType {
  headers: Record<string, string>;
}

const ErrorCodeMap = {
  A0202: 'Token 错误',
  A0211: 'Token 过期',
  '-500': '传参错误',
  '-10001': '服务异常',
  '-10002': '请求参数错误',
  '-60001': '生成上传 URL 失败',
  '-60002': '获取匹配的文件格式失败',
  '-60003': '文件读取失败',
  '-60004': '空文件',
  '-60005': '文件大小超出限制',
  '-60006': '文件页数超过限制',
  '-60007': '模型服务暂时不可用',
  '-60008': '文件读取超时',
  '-60009': '任务提交队列已满',
  '-60010': '解析失败',
  '-60011': '获取有效文件失败',
  '-60012': '找不到任务',
  '-60013': '没有权限访问该任务',
  '-60014': '删除运行中的任务',
  '-60015': '文件转换失败',
  '-60016': '文件转换为指定格式失败'
};

async function fetchWithTimeout(
  input: string | URL | Request,
  init: RequestInit = {},
  timeoutMs = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function batchParse(props: InnerPropsType): Promise<string> {
  const {
    base_url,
    headers,
    files,
    is_ocr,
    enable_formula,
    enable_table,
    language,
    model_version,
    extra_formats
  } = props;
  const url = new URL(base_url);
  const batchUrl = `${url.origin}/api/v4/extract/task/batch`;
  const payload: BatchPayloadType = {
    enable_formula: enable_formula ?? true,
    enable_table: enable_table ?? true,
    language: language ?? 'ch',
    model_version: model_version ?? 'pipeline',
    extra_formats: extra_formats ?? [],
    files: files.map((file) => ({
      url: file,
      is_ocr: is_ocr ?? false
    }))
  };
  const res = await fetchWithTimeout(
    batchUrl,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    },
    30000
  );
  const data: BatchResponseDataType = await res.json();

  if (data.code !== 0) {
    return Promise.reject(data.msg ?? ErrorCodeMap[data.code]);
  }

  return data.data.batch_id;
}

async function extractResult(batchId: string, props: InnerPropsType): Promise<ExtracResultType[]> {
  const { base_url, headers } = props;
  const MAX_RETRIES = 100;
  const url = new URL(base_url);
  const queryFn = async () => {
    const extractResultUrl = `${url.origin}/api/v4/extract-results/batch/${batchId}`;
    const res = await fetchWithTimeout(
      extractResultUrl,
      {
        method: 'GET',
        headers
      },
      30000
    );
    const data: ExtractBatchType = await res.json();

    if (data.code !== 0) {
      return Promise.reject(data.msg ?? ErrorCodeMap[data.code]);
    }

    return data.data.extract_result;
  };
  const completedFiles = new Set<string>();
  const result: ExtracResultType[] = [];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const batchResult = await queryFn();
      const failedItems = batchResult.filter((item) => item.state === 'failed');

      if (failedItems.length > 0) {
        const errorMessages = failedItems
          .map((item) => item.err_msg ?? 'Extract failed')
          .join('; ');
        return Promise.reject(`Extract failed: ${errorMessages}`);
      }

      const newCompletedItems = batchResult.filter(
        (item) => item.state === 'done' && !completedFiles.has(item.file_name)
      );

      if (newCompletedItems.length > 0) {
        const extractedResults = await Promise.all(
          newCompletedItems.map(async (item) => {
            completedFiles.add(item.file_name);
            return extractFromZip(item.full_zip_url);
          })
        );
        result.push(...extractedResults);
      }

      if (completedFiles.size >= props.files.length) {
        break;
      }
    } catch (error) {
      console.error(`Retry ${attempt} failed:`, error);

      if (attempt === MAX_RETRIES) {
        throw error;
      }
    }

    if (completedFiles.size < props.files.length) {
      await delay(5000);
    }
  }

  if (completedFiles.size < props.files.length) {
    console.warn(
      `Max retries reached. Completed ${completedFiles.size}/${props.files.length} files.`
    );
  }

  return result;
}

function buildHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    source: 'fastgpt'
  };
}

async function extractFromZip(zipUrl: string): Promise<ExtracResultType> {
  let res: Response;
  try {
    res = await fetchWithTimeout(
      zipUrl,
      {
        method: 'GET'
      },
      60000
    );
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`[MinerU][extractFromZip] fetch timeout: ${zipUrl}`);
    }

    throw err;
  }

  if (!res.ok) {
    throw new Error(
      `[MinerU][extractFromZip] download zip failed: ${res.status} ${res.statusText}`
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const result: ExtracResultType = {
    images: {} as Record<string, string>,
    content: '' as string,
    content_list: [] as any[]
  };
  const imageUploadTasks: Promise<void>[] = [];
  const fileProcessTasks: Promise<void>[] = [];
  let markdownContent: string | undefined;
  // Upload images (collect tasks)
  zip.folder('images')?.forEach((relativePath, file) => {
    imageUploadTasks.push(
      (async () => {
        const image = await file.async('base64');
        const { accessUrl } = await uploadFile({
          base64: image,
          defaultFilename: file.name
        });
        result.images[relativePath] = accessUrl;
      })()
    );
  });
  // Process files (collect tasks)
  zip.forEach((_, file) => {
    if (!file.dir) {
      if (file.name.endsWith('.md')) {
        fileProcessTasks.push(
          (async () => {
            markdownContent = await file.async('text');
            result.content = markdownContent;
          })()
        );
      } else if (file.name.endsWith('.json') && file.name !== 'layout.json') {
        fileProcessTasks.push(
          (async () => {
            result.content_list = JSON.parse(await file.async('text'));
          })()
        );
      } else if (file.name.endsWith('.html')) {
        fileProcessTasks.push(
          (async () => {
            result.html = await file.async('text');
          })()
        );
      } else if (file.name.endsWith('.docx')) {
        fileProcessTasks.push(
          (async () => {
            const { accessUrl } = await uploadFile({
              buffer: await file.async('nodebuffer'),
              defaultFilename: file.name
            });
            result.docx = accessUrl;
          })()
        );
      } else if (file.name.endsWith('.tex')) {
        fileProcessTasks.push(
          (async () => {
            result.latex_content = await file.async('text');
          })()
        );
      }
    }
  });

  await Promise.all(fileProcessTasks);
  await Promise.all(imageUploadTasks);

  if (markdownContent) {
    result.content = replaceImageUrl(markdownContent, result.images);
  }

  return result;
}

function replaceImageUrl(content: string, images: Record<string, string>) {
  for (const [key, value] of Object.entries(images)) {
    content = content.replace(new RegExp(`images/${key}`, 'g'), value);
  }
  return content;
}

export async function tool(props: PropsType): Promise<z.infer<typeof OutputType>> {
  const { base_url, token } = props;
  const innerProps: InnerPropsType = {
    ...props,
    headers: buildHeaders(token)
  };

  // Create batch request
  if (!base_url) {
    return Promise.reject('MinerU base url is required');
  }

  const batchId = await batchParse(innerProps);
  const result = await extractResult(batchId, innerProps);

  return {
    result
  };
}
