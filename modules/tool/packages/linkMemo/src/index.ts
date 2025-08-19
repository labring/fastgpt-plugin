import { z } from 'zod';
import type { RunToolSecondParamsType } from '@tool/type/tool';
import { StreamDataAnswerTypeEnum } from '@tool/type/tool';
import { getErrText } from '@tool/utils/err';

export const InputType = z.object({
  query: z.string().describe('用户提问内容'),
  dingdingUrl: z.string().describe('钉钉Memo服务根地址'),
  sysAccessKey: z.string().describe('钉钉Memo系统AccessKey'),
  corpId: z.string().describe('钉钉Memo企业ID'),
  appId: z.string().describe('钉钉Memo应用ID'),
  appAccessKey: z.string().describe('钉钉Memo应用AccessKey'),
  iscontact: z.boolean().optional().describe('是否使用职级')
});

export const OutputType = z.object({
  content: z.string().describe('完整答案'),
  citeLinks: z
    .array(
      z.object({
        name: z.string().describe('知识参考文档显示名称'),
        url: z.string().describe('文档链接')
      })
    )
    .optional()
    .describe('参考文档列表')
});

type ReferenceDocument = {
  name: string;
  webUrl: string;
  dingUrl: string;
};

type StreamData = {
  streamData?: string;
  isFinished?: boolean;
  customMessage?: {
    memoChainData?: {
      referenceDocuments?: ReferenceDocument[];
    };
    completedContent?: string;
  };
};

function buildQueryString(query: string, iscontact: boolean, userContact?: string): string {
  const userParts: string[] = [];

  if (iscontact && userContact) {
    userParts.push(`我的职级是${userContact}`);
  }

  return userParts.length > 0 ? userParts.join('，') + '，' + query : query;
}

function extractCiteLinks(docs: ReferenceDocument[]) {
  const citeLinks: Array<{ name: string; url: string }> = [];

  docs.forEach((doc) => {
    citeLinks.push({
      name: `${doc.name}`,
      url: doc.webUrl
    });
  });

  return citeLinks;
}

function parseDataString(
  line: string,
  lines: string[],
  index: number
): { dataStr: string; nextIndex: number } {
  let dataStr = '';
  let nextIndex = index;

  if (line.startsWith('data: ')) {
    dataStr = line.slice(6);
  } else if (line === 'data:' && index + 1 < lines.length) {
    dataStr = lines[index + 1];
    nextIndex = index + 1;
  } else if (line.startsWith('data:') && line.length > 5) {
    dataStr = line.slice(5);
  }

  return { dataStr, nextIndex };
}

export async function tool(
  {
    query,
    dingdingUrl,
    sysAccessKey,
    corpId,
    appId,
    appAccessKey,
    iscontact
  }: z.infer<typeof InputType>,
  { systemVar, streamResponse }: RunToolSecondParamsType
): Promise<z.infer<typeof OutputType>> {
  try {
    const url = new URL('/v2/open/api/onpremise/memo/stream/query', dingdingUrl);

    url.searchParams.append('userId', systemVar.user.username);
    url.searchParams.append('sysAccessKey', sysAccessKey);
    url.searchParams.append('corpId', corpId);
    url.searchParams.append('appId', appId.toString());
    url.searchParams.append('appAccessKey', appAccessKey);

    const queryString = buildQueryString(query, iscontact || false, systemVar.user.contact);

    url.searchParams.append('query', queryString);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      return Promise.reject(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return Promise.reject('无法获取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let completedContent = '';
    let accumulatedContent = '';
    let citeLinks: Array<{ name: string; url: string }> = [];
    let isFinished = false;

    while (!isFinished) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const { dataStr, nextIndex } = parseDataString(line, lines, i);
        i = nextIndex;

        if (!dataStr.trim()) continue;

        try {
          const data: StreamData = JSON.parse(dataStr);

          if (data.streamData && !data.isFinished) {
            await streamResponse({
              type: StreamDataAnswerTypeEnum.answer,
              content: data.streamData
            });
            accumulatedContent += data.streamData;
          }

          if (data.customMessage?.memoChainData?.referenceDocuments) {
            citeLinks = extractCiteLinks(data.customMessage.memoChainData.referenceDocuments);
          }

          if (data.customMessage?.completedContent) {
            completedContent = data.customMessage.completedContent;
          }

          if (data.isFinished === true) {
            isFinished = true;
            break;
          }
        } catch {
          // Ignore parse errors for malformed SSE data
          continue;
        }
      }
    }

    reader.releaseLock();

    return {
      content: completedContent || accumulatedContent,
      citeLinks: citeLinks.length > 0 ? citeLinks : undefined
    };
  } catch (error) {
    return Promise.reject(getErrText(error));
  }
}
