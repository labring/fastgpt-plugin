import { getErrText } from '@tool/utils/err';
import { z } from 'zod';

export const InputType = z.object({
  apiKey: z.string().optional(),
  volcengineAccessKey: z.string().optional(),
  volcengineSecretKey: z.string().optional(),
  query: z.string(),
  count: z
    .number()
    .optional()
    .default(10)
    .refine((val) => val >= 1 && val <= 50, {
      message: 'count must be between 1 and 50'
    }),
  sites: z.string().optional().default(''),
  time_range: z.string().optional().default('')
});

export const OutputType = z.object({
  result: z.array(
    z.object({
      Title: z.string().nullable().optional(),
      Content: z.string().nullable(),
      Url: z.string().nullable().optional(),
      SiteName: z.string().nullable().optional(),
      PublishTime: z.string().nullable().optional()
    })
  )
});

function validateCredentials(
  apiKey?: string,
  volcengineAccessKey?: string,
  volcengineSecretKey?: string
) {
  if (!apiKey && !(volcengineAccessKey && volcengineSecretKey)) {
    throw new Error('Either API key or both Volcengine access key and secret key must be provided');
  }
}

function determineAuthMethod(
  apiKey?: string,
  volcengineAccessKey?: string,
  volcengineSecretKey?: string
) {
  if (apiKey) {
    return { method: 'api_key', baseUrl: 'https://open.feedcoopapi.com' };
  } else if (volcengineAccessKey && volcengineSecretKey) {
    return { method: 'volcengine', baseUrl: 'https://mercury.volcengineapi.com' };
  }
  throw new Error('Invalid authentication configuration');
}

async function generateVolcengineSignature(accessKey: string, secretKey: string, requestObj: any) {
  const service = 'volc_torchlight_api';
  const version = '2025-01-01';
  const region = 'cn-north-1';
  const host = 'mercury.volcengineapi.com';
  const contentType = 'application/json';

  const now = new Date();
  const xDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const shortXDate = xDate.slice(0, 8);

  const body = JSON.stringify(requestObj);
  const encoder = new TextEncoder();
  const bodyBytes = encoder.encode(body);

  const crypto = globalThis.crypto;
  const xContentSha256 = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', bodyBytes))
  )
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const queryParams = {
    Action: 'WebSearch',
    Version: version
  };

  const normalizedQuery = Object.keys(queryParams)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent((queryParams as any)[key])}`)
    .join('&')
    .replace(/\+/g, '%20');

  const canonicalRequest = [
    'POST',
    '/',
    normalizedQuery,
    `content-type:${contentType}`,
    `host:${host}`,
    `x-content-sha256:${xContentSha256}`,
    `x-date:${xDate}`,
    '',
    'content-type;host;x-content-sha256;x-date',
    xContentSha256
  ].join('\n');

  const credentialScope = `${shortXDate}/${region}/${service}/request`;
  const canonicalRequestHash = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest)))
  )
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const stringToSign = `HMAC-SHA256\n${xDate}\n${credentialScope}\n${canonicalRequestHash}`;

  const hmacSha256 = async (key: BufferSource, content: string) => {
    return new Uint8Array(
      await crypto.subtle.sign(
        'HMAC',
        await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, [
          'sign'
        ]),
        encoder.encode(content)
      )
    );
  };

  const kDate = await hmacSha256(encoder.encode(secretKey), shortXDate);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, 'request');
  const signature = Array.from(await hmacSha256(kSigning, stringToSign))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const authorization = `HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=content-type;host;x-content-sha256;x-date, Signature=${signature}`;

  return {
    'Content-Type': contentType,
    Host: host,
    'X-Date': xDate,
    'X-Content-Sha256': xContentSha256,
    Authorization: authorization,
    'X-Traffic-Tag': 'fast_gpt_search_web'
  };
}

export async function tool({
  apiKey,
  volcengineAccessKey,
  volcengineSecretKey,
  query,
  count = 10,
  sites = '',
  time_range = ''
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    validateCredentials(apiKey, volcengineAccessKey, volcengineSecretKey);

    if (!query || !query.trim()) {
      throw new Error('Query cannot be empty');
    }

    if (query.length > 100) {
      throw new Error('Query cannot exceed 100 characters');
    }

    const auth = determineAuthMethod(apiKey, volcengineAccessKey, volcengineSecretKey);

    const requestData: any = {
      Query: query.trim(),
      SearchType: 'web',
      Count: count,
      NeedSummary: true
    };

    if (sites) {
      const siteList = sites
        .split('|')
        .map((s) => s.trim())
        .filter((s) => s);
      if (siteList.length > 5) {
        throw new Error('Maximum 5 sites allowed in filter');
      }
      requestData.Filter = { Sites: siteList.join('|') };
    }

    if (time_range) {
      requestData.TimeRange = time_range;
    }

    let response;

    if (auth.method === 'api_key') {
      response = await fetch(`${auth.baseUrl}/search_api/web_search`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Traffic-Tag': 'fast_gpt_search_web'
        },
        body: JSON.stringify(requestData)
      });
    } else {
      const headers = await generateVolcengineSignature(
        volcengineAccessKey!,
        volcengineSecretKey!,
        requestData
      );

      const queryParams = new URLSearchParams({
        Action: 'WebSearch',
        Version: '2025-01-01'
      });

      response = await fetch(`${auth.baseUrl}/?${queryParams}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });
    }

    if (!response.ok) {
      return Promise.reject({
        error: `HTTP error: ${response.status} ${response.statusText}`
      });
    }

    const data = await response.json();

    if (data?.ResponseMetadata?.Error?.Message) {
      return Promise.reject({
        error: data?.ResponseMetadata?.Error?.Message
      });
    }

    const result = data?.Result?.WebResults;
    if (!result) {
      return Promise.reject({
        error: 'Invalid response format: missing Result or WebResults'
      });
    }

    return {
      result: result.map((item: any) => ({
        Title: item.Title,
        Content: item.Content || item.Summary || item.Snippet || '',
        Url: item.Url,
        SiteName: item.SiteName,
        PublishTime: item.PublishTime
      }))
    };
  } catch (error) {
    return Promise.reject({
      error: getErrText(error)
    });
  }
}
