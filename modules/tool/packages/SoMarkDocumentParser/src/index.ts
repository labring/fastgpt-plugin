import { z } from 'zod';
import { POST } from '@tool/utils/request';
import { delay } from '@tool/utils/delay';

// ---------- 输入输出 Schema ----------

// 这里的枚举与 config.ts 的输入项保持同步
const OutputFormatEnum = z.enum(['json', 'markdown']);
const ImageFormatEnum = z.enum(['url', 'base64', 'none']);
const FormulaFormatEnum = z.enum(['latex', 'mathml', 'ascii']);
const TableFormatEnum = z.enum(['markdown', 'html', 'image']);
const ChemicalStructureFormatEnum = z.enum(['image']);
const DEFAULT_BASE_URL = 'https://somark.tech/api/v1';

export const InputType = z.object({
  // ----- 密钥配置（来自 secretInputConfig）-----
  baseUrl: z.string(),
  apiKey: z.string().optional().default(''),

  // ----- 文件输入 -----
  // FastGPT 的 fileSelect 以字符串数组形式传入文件下载 URL
  file: z.array(z.string()).min(1, 'file is required'),

  // ----- 输出格式 / 元素格式 -----
  outputFormats: z.array(OutputFormatEnum).min(1).default(['json', 'markdown']),
  imageFormat: ImageFormatEnum.default('url'),
  formulaFormat: FormulaFormatEnum.default('latex'),
  tableFormat: TableFormatEnum.default('html'),
  chemicalStructureFormat: ChemicalStructureFormatEnum.default('image'),

  // ----- 特色功能开关 -----
  enableTextCrossPage: z.boolean().default(false),
  enableTableCrossPage: z.boolean().default(false),
  enableTitleLevelRecognition: z.boolean().default(false),
  enableInlineImage: z.boolean().default(true),
  enableTableImage: z.boolean().default(true),
  enableImageUnderstanding: z.boolean().default(true),
  keepHeaderFooter: z.boolean().default(false)
});
export type InputProps = z.infer<typeof InputType>;

// 单个文件的解析结果;部分成功语义下,失败项以 error 字段说明,markdown/json 为空
export const FileResultType = z.object({
  markdown: z.string().default(''),
  json: z.record(z.string(), z.any()).default({}),
  error: z.string().optional()
});
export type FileResult = z.infer<typeof FileResultType>;

export const OutputType = z.object({
  results: z.array(FileResultType).default([])
});
export type OutputProps = z.infer<typeof OutputType>;

// ---------- 重试 / 轮询 配置 ----------

// SoMark 并发限流错误码;提交阶段命中该码时按退避策略重试
const QPS_LIMIT_CODE = 1124;

// 提交阶段:对"并发槽位已满"的拒绝做有限重试
const SUBMIT_BUDGET_MS = 10 * 60_000; // 提交重试的总时间预算(10 分钟)
const SUBMIT_BACKOFF_BASE_MS = 1_000; // 提交重试的起始退避时长
const SUBMIT_BACKOFF_MAX_MS = 10_000; // 单次退避上限
const SUBMIT_BACKOFF_JITTER_MS = 500; // 退避抖动,避免多并发调用同步撞车

// 轮询阶段:持续查询任务状态直至成功 / 失败 / 预算耗尽
const POLL_BUDGET_MS = 10 * 60_000; // 单任务的最长等待时长
const POLL_INTERVAL_BASE_MS = 2_000; // 轮询起始间隔
const POLL_INTERVAL_MAX_MS = 10_000; // 长任务的轮询间隔上限
const POLL_INTERVAL_GROWTH = 1.5; // 每次轮询后的间隔放大倍数

// ---------- 文件处理辅助函数 ----------

function normalizeFileName(filename: string): string {
  return filename.split(/[\\/]/).at(-1)?.trim() || '';
}

function getFileName(fileUrl: string): string {
  try {
    const url = new URL(fileUrl);
    const filename = url.searchParams.get('filename');
    if (filename) {
      return normalizeFileName(filename) || 'document';
    }

    const { pathname } = url;
    const name = decodeURIComponent(pathname.split('/').filter(Boolean).at(-1) ?? '');
    return normalizeFileName(name) || 'document';
  } catch {
    return 'document';
  }
}

async function fetchFileBlob(fileUrl: string): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
  }

  return {
    blob: await response.blob(),
    filename: getFileName(fileUrl)
  };
}

// ---------- SoMark 异步 API ----------

// 提交接口响应:成功时返回 task_id,失败时返回业务错误码
type SubmitResponse = {
  code: number;
  message: string;
  data: {
    task_id?: string;
    status?: string;
  } | null;
};

// 查询接口响应:返回任务状态,任务完成时附带 outputs
type CheckResponse = {
  code: number;
  message: string;
  data: {
    record_id?: number;
    task_id?: string;
    status?: string; // 预期取值:'QUEUING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
    file_name?: string;
    metadata?: object;
    result?: {
      file_name?: string;
      outputs?: { markdown?: string; json?: object };
    };
  } | null;
};

function extractErrorDetail(
  data: SubmitResponse | CheckResponse | null | undefined,
  fallback = 'unknown error'
): string {
  return data?.message || fallback;
}

// 从 unknown 错误中安全提取 message;本文件内每个 throw 都是 Error 实例,
// String(err) 兜底纯粹是 defensive,运行时不会命中。
// 整个函数从覆盖率统计中排除(v8 把 if/else 当作同一分支记录在 if 行上,
// 单独 ignore 任一分支都无法把这条 branch 从分母中扣除)。
/* v8 ignore start */
function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
/* v8 ignore stop */

function buildConnectionError(handledBaseUrl: string, endpoint: string): Error {
  const protocol = handledBaseUrl.startsWith('https://') ? 'HTTPS' : 'HTTP';
  const host = handledBaseUrl.replace(/^https?:\/\//, '');
  return new Error(
    `Failed to connect to the SoMark service at ${host}${endpoint} over ${protocol}. Please make sure the service is running and reachable from the plugin runtime`
  );
}

async function submitTask(form: FormData, baseURL: string): Promise<string> {
  const deadline = Date.now() + SUBMIT_BUDGET_MS;
  let attempt = 0;

  while (true) {
    let response;
    try {
      response = await POST<SubmitResponse>('/parse/async', form, {
        baseURL,
        headers: {},
        timeout: 60_000,
        retries: 1
      });
    } catch {
      throw buildConnectionError(baseURL, '/parse/async');
    }

    const { data } = response;

    if (data?.code === 0 && data.data?.task_id) {
      return data.data.task_id;
    }

    // 并发槽位 / QPS 拒绝:在预算内退避后重试
    if (data?.code === QPS_LIMIT_CODE) {
      const backoff = Math.min(SUBMIT_BACKOFF_BASE_MS * 2 ** attempt, SUBMIT_BACKOFF_MAX_MS);
      const wait = backoff + Math.floor(Math.random() * SUBMIT_BACKOFF_JITTER_MS);

      if (Date.now() + wait > deadline) {
        throw new Error(
          'SoMark service is currently busy (QPS limit). Please retry later or reduce workflow concurrency'
        );
      }
      await delay(wait);
      attempt++;
      continue;
    }

    // 其他业务错误:立即抛出,不重试
    throw new Error(`SoMark API error: ${extractErrorDetail(data)}`);
  }
}

async function pollTask(
  taskId: string,
  baseURL: string,
  apiKey: string
): Promise<NonNullable<NonNullable<CheckResponse['data']>['result']>['outputs']> {
  const deadline = Date.now() + POLL_BUDGET_MS;
  let interval = POLL_INTERVAL_BASE_MS;

  while (Date.now() < deadline) {
    await delay(interval);

    const form = new FormData();
    form.append('api_key', apiKey);
    form.append('task_id', taskId);

    let response;
    try {
      response = await POST<CheckResponse>('/parse/async_check', form, {
        baseURL,
        headers: {},
        timeout: 30_000,
        retries: 1
      });
    } catch {
      throw buildConnectionError(baseURL, '/parse/async_check');
    }

    const { data } = response;

    if (data?.code !== 0) {
      throw new Error(`SoMark API error: ${extractErrorDetail(data)}`);
    }

    const status = data.data?.status;
    if (status === 'SUCCESS') {
      return data.data?.result?.outputs;
    }
    if (status === 'FAILED') {
      throw new Error(`SoMark task failed: ${extractErrorDetail(data, 'task failed')}`);
    }

    // QUEUING / PROCESSING → 拉长轮询间隔后继续等
    interval = Math.min(Math.floor(interval * POLL_INTERVAL_GROWTH), POLL_INTERVAL_MAX_MS);
  }

  throw new Error(
    `SoMark task ${taskId} timed out after ${POLL_BUDGET_MS / 1000}s while waiting for completion`
  );
}

// ---------- 工具主流程 ----------

/**
 * SoMark 文档解析工具
 *
 * 通过 SoMark 的异步管线提交文件并获取解析结果:
 *   1. POST /parse/async         —— 提交文件,拿到 task_id(命中 QPS 限流时按退避策略重试)
 *   2. POST /parse/async_check   —— 轮询任务状态,直到 SUCCESS / FAILED / 预算耗尽
 *
 * 异步管线让多个并发调用自动在 SoMark 的并发槽位前排队,
 * 而不需要长连接占住客户端资源
 */
// 解析单个文件:下载 → 提交 → 轮询 → 输出
async function parseOneFile(
  fileUrl: string,
  ctx: {
    baseURL: string;
    apiKey: string;
    outputFormats: InputProps['outputFormats'];
    imageFormat: InputProps['imageFormat'];
    formulaFormat: InputProps['formulaFormat'];
    tableFormat: InputProps['tableFormat'];
    chemicalStructureFormat: InputProps['chemicalStructureFormat'];
    enableTextCrossPage: boolean;
    enableTableCrossPage: boolean;
    enableTitleLevelRecognition: boolean;
    enableInlineImage: boolean;
    enableTableImage: boolean;
    enableImageUnderstanding: boolean;
    keepHeaderFooter: boolean;
  }
): Promise<FileResult> {
  if (!fileUrl) {
    throw new Error('File path is required');
  }

  let fileData: { blob: Blob; filename: string };
  try {
    fileData = await fetchFileBlob(fileUrl);
  } catch {
    throw new Error(
      'Failed to download file. Please ensure the FastGPT file URL is accessible from the plugin service'
    );
  }

  const { blob, filename } = fileData;
  const form = new FormData();
  form.append('file', blob, filename);
  form.append('api_key', ctx.apiKey);

  for (const format of ctx.outputFormats) {
    form.append('output_formats', format);
  }
  form.append(
    'element_formats',
    JSON.stringify({
      image: ctx.imageFormat,
      formula: ctx.formulaFormat,
      table: ctx.tableFormat,
      cs: ctx.chemicalStructureFormat
    })
  );
  form.append(
    'feature_config',
    JSON.stringify({
      enable_text_cross_page: ctx.enableTextCrossPage,
      enable_table_cross_page: ctx.enableTableCrossPage,
      enable_title_level_recognition: ctx.enableTitleLevelRecognition,
      enable_inline_image: ctx.enableInlineImage,
      enable_table_image: ctx.enableTableImage,
      enable_image_understanding: ctx.enableImageUnderstanding,
      keep_header_footer: ctx.keepHeaderFooter
    })
  );

  const taskId = await submitTask(form, ctx.baseURL);
  const outputs = await pollTask(taskId, ctx.baseURL, ctx.apiKey);

  if (!outputs) {
    throw new Error('SoMark response has no outputs');
  }

  return {
    markdown: ctx.outputFormats.includes('markdown') ? outputs.markdown ?? '' : '',
    json: ctx.outputFormats.includes('json') ? outputs.json ?? {} : {}
  };
}

export async function tool(props: InputProps): Promise<OutputProps> {
  const {
    apiKey,
    baseUrl,
    file,
    outputFormats,
    imageFormat,
    formulaFormat,
    tableFormat,
    chemicalStructureFormat,
    enableTextCrossPage,
    enableTableCrossPage,
    enableTitleLevelRecognition,
    enableInlineImage,
    enableTableImage,
    enableImageUnderstanding,
    keepHeaderFooter
  } = props;

  let handledBaseUrl = baseUrl.trim();
  if (handledBaseUrl === '') {
    throw new Error('Base URL is required');
  }
  handledBaseUrl = handledBaseUrl.replace(/\/+$/, '');
  if (!handledBaseUrl.startsWith('http://') && !handledBaseUrl.startsWith('https://')) {
    throw new Error('Base URL must start with http:// or https://');
  }

  const handledApiKey = apiKey.trim();
  if (
    handledBaseUrl === DEFAULT_BASE_URL &&
    (handledApiKey.length === 0 || !handledApiKey.startsWith('sk-'))
  ) {
    throw new Error('API Key is invalid, please check the configuration and try again');
  }

  const ctx = {
    baseURL: handledBaseUrl,
    apiKey: handledApiKey,
    outputFormats,
    imageFormat,
    formulaFormat,
    tableFormat,
    chemicalStructureFormat,
    enableTextCrossPage,
    enableTableCrossPage,
    enableTitleLevelRecognition,
    enableInlineImage,
    enableTableImage,
    enableImageUnderstanding,
    keepHeaderFooter
  };

  // 严格串行:SoMark 异步队列上限为 4,串行最稳妥,QPS 退避作为兜底
  // 单文件失败不中断后续文件,先收集所有结果;若有任何失败,在所有文件跑完后整体抛错
  const results: FileResult[] = [];
  for (const fileUrl of file) {
    try {
      results.push(await parseOneFile(fileUrl, ctx));
    } catch (err) {
      results.push({
        markdown: '',
        json: {},
        error: toErrorMessage(err)
      });
    }
  }

  const failedIndexes = results.map((r, i) => (r.error ? i : -1)).filter((i) => i >= 0);
  if (failedIndexes.length > 0) {
    const reasons = failedIndexes.map((i) => `[${i}] ${results[i].error}`).join('; ');
    throw new Error(
      `${failedIndexes.length} of ${results.length} file(s) failed to parse: ${reasons}`
    );
  }

  return { results };
}
