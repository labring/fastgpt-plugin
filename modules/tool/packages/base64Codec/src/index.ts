import { z } from 'zod';

const InputSchema = z.object({
  action: z.enum(['encode', 'fileEncode', 'imageEncode', 'toHex', 'fromHex']),
  text: z.string().optional(),
  encoded: z.string().optional(),
  hex: z.string().optional(),
  fileUrl: z.string().url().optional(),
  urlsafe: z.boolean().optional().default(false),
  timeoutMs: z.number().int().positive().optional().default(20000)
});

type Input = z.infer<typeof InputSchema>;

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getBaseUrl() {
  return getEnv('BASE64_CODEC_BASE_URL').replace(/\/+$/, '');
}

function getApiKey() {
  return getEnv('BASE64_CODEC_API_KEY');
}

function authHeaders(extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    ...(extra || {})
  };
}

async function postFormUrlEncoded(
  path: string,
  payload: Record<string, string>,
  timeoutMs: number
) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body = new URLSearchParams(payload);
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: 'POST',
      headers: authHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      }),
      body,
      signal: controller.signal
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
    }
    return data;
  } finally {
    clearTimeout(t);
  }
}

async function fetchFileAsBlob(fileUrl: string, timeoutMs: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(fileUrl, { signal: controller.signal });
    if (!res.ok) throw new Error(`Download file failed: HTTP ${res.status}`);

    const blob = await res.blob();
    const contentDisposition = res.headers.get('content-disposition') || '';
    const match = contentDisposition.match(/filename="?([^"]+)"?/i);
    const filename = match?.[1] || 'upload.bin';

    return { blob, filename };
  } finally {
    clearTimeout(t);
  }
}

async function postMultipart(
  path: string,
  blob: Blob,
  filename: string,
  urlsafe: boolean,
  timeoutMs: number
) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const form = new FormData();
    form.append('file', blob, filename);
    form.append('urlsafe', String(urlsafe));

    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: 'POST',
      headers: authHeaders(), // 不手动设 Content-Type，浏览器/运行时自动加 boundary
      body: form,
      signal: controller.signal
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
    }
    return data;
  } finally {
    clearTimeout(t);
  }
}

/**
 * 统一执行入口（与现有工具风格保持“输入->返回对象”）
 */
export default async function run(input: unknown) {
  const p = InputSchema.parse(input) as Input;

  switch (p.action) {
    case 'encode': {
      if (!p.text) throw new Error('text is required for action=encode');
      const data = await postFormUrlEncoded(
        '/api/base64/encode',
        {
          text: p.text,
          urlsafe: String(p.urlsafe)
        },
        p.timeoutMs
      );
      return { encoded: data.encoded };
    }

    case 'toHex': {
      if (!p.encoded) throw new Error('encoded is required for action=toHex');
      const data = await postFormUrlEncoded(
        '/api/base64/to-hex',
        {
          encoded: p.encoded,
          urlsafe: String(p.urlsafe)
        },
        p.timeoutMs
      );
      return { hex: data.hex };
    }

    case 'fromHex': {
      if (!p.hex) throw new Error('hex is required for action=fromHex');
      const data = await postFormUrlEncoded(
        '/api/base64/from-hex',
        {
          hex: p.hex,
          urlsafe: String(p.urlsafe)
        },
        p.timeoutMs
      );
      return { encoded: data.encoded };
    }

    case 'fileEncode': {
      if (!p.fileUrl) throw new Error('fileUrl is required for action=fileEncode');
      const { blob, filename } = await fetchFileAsBlob(p.fileUrl, p.timeoutMs);
      const data = await postMultipart(
        '/api/base64/file-encode',
        blob,
        filename,
        !!p.urlsafe,
        p.timeoutMs
      );
      return {
        encoded: data.encoded,
        filename: data.filename || filename
      };
    }

    case 'imageEncode': {
      if (!p.fileUrl) throw new Error('fileUrl is required for action=imageEncode');
      const { blob, filename } = await fetchFileAsBlob(p.fileUrl, p.timeoutMs);
      const data = await postMultipart(
        '/api/base64/image-encode',
        blob,
        filename,
        !!p.urlsafe,
        p.timeoutMs
      );
      return { encoded: data.encoded };
    }

    default:
      throw new Error(`Unsupported action: ${(p as any).action}`);
  }
}
