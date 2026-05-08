import { z } from 'zod';
import { POST } from '@tool/utils/request';

// ---------- IO Schema ----------

// Enums kept in sync with config.ts inputs
const OutputFormatEnum = z.enum(['json', 'markdown']);
const ImageFormatEnum = z.enum(['url', 'base64', 'none']);
const FormulaFormatEnum = z.enum(['latex', 'mathml', 'ascii']);
const TableFormatEnum = z.enum(['markdown', 'html', 'image']);
const ChemicalStructureFormatEnum = z.enum(['image']);

export const InputType = z.object({
  // ----- Secrets (from secretInputConfig) -----
  apiKey: z.string().min(1, 'apiKey is required'),
  baseUrl: z.url().default('https://somark.tech/api/v1'),

  // ----- File input -----
  // FastGPT fileSelect passes selected file URLs as an array.
  file: z.array(z.string()).length(1, 'file is required'),

  // ----- Output / element formats -----
  outputFormats: z.array(OutputFormatEnum).min(1).default(['json', 'markdown']),
  imageFormat: ImageFormatEnum.default('url'),
  formulaFormat: FormulaFormatEnum.default('latex'),
  tableFormat: TableFormatEnum.default('html'),
  chemicalStructureFormat: ChemicalStructureFormatEnum.default('image'),

  // ----- Feature switches -----
  enableTextCrossPage: z.boolean().default(false),
  enableTableCrossPage: z.boolean().default(false),
  enableTitleLevelRecognition: z.boolean().default(false),
  enableInlineImage: z.boolean().default(true),
  enableTableImage: z.boolean().default(true),
  enableImageUnderstanding: z.boolean().default(true),
  keepHeaderFooter: z.boolean().default(false)
});
export type InputProps = z.infer<typeof InputType>;

export const OutputType = z.object({
  markdown: z.string().default(''),
  json: z.record(z.string(), z.any()).default({})
});
export type OutputProps = z.infer<typeof OutputType>;

function getFileName(fileUrl: string): string {
  try {
    const { pathname } = new URL(fileUrl);
    const name = decodeURIComponent(pathname.split('/').filter(Boolean).at(-1) ?? '');
    return name || 'document';
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

// ---------- Tool ----------

/**
 * SoMark Document Parser
 *
 * Sends the input file to SoMark API for parsing and returns
 * structured Markdown and/or JSON.
 *
 * NOTE: The exact request body field names and response shape
 * below follow common conventions for SoMark-style document
 * parsing APIs.
 */
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

  // --- Resolve file URL ---
  const fileUrl = file[0];
  if (!fileUrl) {
    throw new Error('Cannot resolve file url from input');
  }
  const { blob, filename } = await fetchFileBlob(fileUrl);

  // --- Build form-data payload ---
  const form = new FormData();
  form.append('file', blob, filename);
  form.append('api_key', apiKey);
  for (const format of outputFormats) {
    form.append('output_formats', format);
  }
  form.append(
    'element_formats',
    JSON.stringify({
      image: imageFormat,
      formula: formulaFormat,
      table: tableFormat,
      chemical_structure: chemicalStructureFormat
    })
  );
  form.append(
    'feature_configs',
    JSON.stringify({
      enable_text_cross_page: enableTextCrossPage,
      enable_table_cross_page: enableTableCrossPage,
      enable_title_level_recognition: enableTitleLevelRecognition,
      enable_inline_image: enableInlineImage,
      enable_table_image: enableTableImage,
      enable_image_understanding: enableImageUnderstanding,
      keep_header_footer: keepHeaderFooter
    })
  );

  // --- Call SoMark API ---
  const { data } = await POST<{
    code: number;
    message: string;
    data: {
      task_id?: string;
      error?: unknown;
      metadata?: Record<string, any>;
      result?: { outputs?: { markdown?: string; json?: Record<string, any> } };
    } | null;
  }>('/parse/sync', form, {
    baseURL: baseUrl,
    headers: {}, // 显式传空 headers，覆盖默认的 Content-Type: application/json
    timeout: 120_000,
    retries: 1
  });

  if (data?.code !== undefined && data.code !== 0) {
    const detail =
      (typeof data?.data?.error === 'string' ? data.data.error : '') ||
      data?.message ||
      'unknown error';
    throw new Error(`SoMark API error: ${detail}`);
  }

  // --- Map response to declared outputs ---
  const outputs = data?.data?.result?.outputs ?? {};
  const markdown = outputFormats.includes('markdown') ? outputs.markdown ?? '' : '';
  const json = outputFormats.includes('json') ? outputs.json ?? {} : {};
  return { markdown, json };
}
