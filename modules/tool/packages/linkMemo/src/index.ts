import { z } from 'zod';
import type { RunToolSecondParamsType } from '@tool/type/tool';
import { StreamDataAnswerTypeEnum } from '@tool/type/tool';

export const InputType = z.object({
  query: z.string().describe('用户提问内容')
});

export const OutputType = z.object({
  content: z.string().describe('完整答案'),
  referenceDocuments: z
    .array(
      z.object({
        webUrl: z.string().describe('浏览器预览链接'),
        name: z.string().describe('知识参考文档显示名称'),
        dingUrl: z.string().describe('钉钉端内预览链接')
      })
    )
    .optional()
    .describe('参考文档列表')
});

export async function tool(
  { query }: z.infer<typeof InputType>,
  { systemVar, streamResponse }: RunToolSecondParamsType
): Promise<z.infer<typeof OutputType>> {
  // change appId to use different app
  const appId = '122';

  const baseUrl = 'http://192.168.59.23:31630';
  const sysAccessKey = 'd6c431c92f0c465986a002a6e81717af';
  const corpId = 'dingaa699e168492c776f2c783f7214b6d69';
  const appAccessKey = '3a99fa58271d44239977807c8a57fce9';
  const userId = systemVar.user.userId;

  const url = new URL('/v2/open/api/onpremise/memo/stream/query', baseUrl);
  url.searchParams.append('sysAccessKey', sysAccessKey);
  url.searchParams.append('corpId', corpId);
  url.searchParams.append('appId', appId.toString());
  url.searchParams.append('appAccessKey', appAccessKey);
  url.searchParams.append('userId', userId);

  url.searchParams.append(
    'query',
    `我是${systemVar.user.membername}，职位是${systemVar.user.rank}，团队是${systemVar.user.teamName},我提问内容是${query}`
  );

  let completedContent = '';
  let accumulatedContent = '';
  let referenceDocuments: Array<{
    webUrl: string;
    name: string;
    dingUrl: string;
  }> = [];

  console.log('information userId', systemVar.user.userId);
  console.log('information membername', systemVar.user.membername);
  console.log('information rank', systemVar.user.rank);
  console.log('information teamName', systemVar.user.teamName);

  try {
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
    let isFinished = false;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      // send stream data to fastgpt
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);

          if (dataStr.trim() === '') continue;

          try {
            const data = JSON.parse(dataStr);

            if (data.streamData && !data.isFinished) {
              await streamResponse({
                type: StreamDataAnswerTypeEnum.answer,
                content: data.streamData
              });
              accumulatedContent += data.streamData;
            }

            if (data.customMessage?.memoChainData?.referenceDocuments) {
              referenceDocuments = data.customMessage.memoChainData.referenceDocuments;
            }

            if (data.customMessage?.completedContent) {
              completedContent = data.customMessage.completedContent;
            }

            if (data.isFinished === true) {
              isFinished = true;
              break;
            }
          } catch (parseError) {
            console.error('解析SSE数据失败:', parseError, 'data:', dataStr);
          }
        }
      }
      if (isFinished) break;
    }

    reader.releaseLock();

    if (!completedContent) {
      completedContent = accumulatedContent;
    }

    return {
      content: completedContent,
      referenceDocuments: referenceDocuments.length > 0 ? referenceDocuments : undefined
    };
  } catch (error) {
    console.error('error', error);
    return Promise.reject('error');
  }
}
