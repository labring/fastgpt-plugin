import { z } from 'zod';
import { createHmac, createHash } from 'node:crypto';

export const InputType = z.object({
  accessKeyId: z.string().min(1, 'AccessKey ID is required'),
  accessKeySecret: z.string().min(1, 'AccessKey Secret is required'),
  fileUrl: z.string().url('Invalid file URL'),
  fileType: z.enum(['pdf', 'docx', 'doc', 'xlsx', 'xls', 'html', 'epub', 'mobi', 'md', 'txt'])
});

export const OutputType = z.object({
  result: z.record(z.string(), z.unknown())
});

/** 对字符串做 RFC 3986 百分号编码 */
function percentEncode(s: string): string {
  return encodeURIComponent(s)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

/** 生成阿里云 RPC 签名 */
function sign(
  accessKeyId: string,
  accessKeySecret: string,
  params: Record<string, string>
): string {
  const sortedKeys = Object.keys(params).sort();
  const canonicalQuery = sortedKeys
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join('&');

  const stringToSign = `POST&${percentEncode('/')}&${percentEncode(canonicalQuery)}`;
  const signingKey = `${accessKeySecret}&`;

  return createHmac('sha1', signingKey).update(stringToSign).digest('base64');
}

export async function tool({
  accessKeyId,
  accessKeySecret,
  fileUrl,
  fileType
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const endpoint = 'https://docmind-api.cn-hangzhou.aliyuncs.com';
  const action = 'SubmitDigitalDocStructureJob';
  const version = '2022-07-11';

  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const nonce = createHash('md5').update(`${Date.now()}${Math.random()}`).digest('hex');

  const params: Record<string, string> = {
    Action: action,
    Version: version,
    AccessKeyId: accessKeyId,
    SignatureMethod: 'HMAC-SHA1',
    SignatureVersion: '1.0',
    SignatureNonce: nonce,
    Timestamp: timestamp,
    Format: 'JSON',
    FileUrl: fileUrl,
    FileNameExtension: fileType
  };

  params.Signature = sign(accessKeyId, accessKeySecret, params);

  const body = new URLSearchParams(params).toString();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok || data['Code'] === 'Error' || (data['Status'] && data['Status'] === 'Fail')) {
    const msg =
      (data['Message'] as string | undefined) ||
      (data['ErrMsg'] as string | undefined) ||
      `HTTP ${response.status}`;
    throw new Error(`阿里云文档解析失败: ${msg}`);
  }

  return { result: data };
}
