import { z } from 'zod';
import type { RunToolSecondParamsType } from '@tool/type/tool';
import { StreamDataAnswerTypeEnum } from '@tool/type/tool';
import { getErrText } from '@tool/utils/err';

export const InputType = z.object({
  query: z.string(),
  appId: z.string(),
  appAccessKey: z.string(),
  sessionId: z.string(),
  chatBIUrl: z.string(),
  sysAccessKey: z.string(),
  corpId: z.string()
});

export const OutputType = z.object({
  displayContentList: z.array(z.any())
});

export async function tool(
  {
    query,
    appId,
    appAccessKey,
    sessionId,
    chatBIUrl,
    sysAccessKey,
    corpId
  }: z.infer<typeof InputType>,
  { systemVar, streamResponse }: RunToolSecondParamsType
): Promise<z.infer<typeof OutputType>> {
  try {
    const url = new URL('/v2/open/api/common/stream/chatbi/chatNew', chatBIUrl);

    // userID get from systemVar
    const userId = systemVar.user.username.split('-')[1];

    if (!sessionId) {
      sessionId = userId;
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sysAccessKey: sysAccessKey,
        corpId: corpId,
        appId: appId,
        appAccessKey: appAccessKey,
        userId: userId,
        query: query,
        sessionId: sessionId
      })
    });

    if (!response.ok) {
      return Promise.reject(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();

    if (!reader) {
      return Promise.reject('无法获取响应流');
    }

    const decoder = new TextDecoder();
    const displayContentList: any[] = [];
    let buffer = '';
    let isFinished = false;
    let previousLength = 0;

    while (!isFinished) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');

      buffer = events.pop() || '';

      for (const event of events) {
        if (!event.trim()) continue;

        const lines = event.split('\n');
        let eventData = '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            // remove "data:" and trim
            eventData = line.slice(5).trim();
            break;
          }
        }

        if (eventData && eventData !== '') {
          try {
            const data = JSON.parse(eventData);

            if (data.displayContentList && data.displayContentList.length > previousLength) {
              const newItems = data.displayContentList.slice(previousLength);

              for (const item of newItems) {
                // 只有等待 type 输出成功后再输出那一整个
                if (item.type !== undefined) {
                  await streamResponse({
                    type: StreamDataAnswerTypeEnum.answer,
                    content: JSON.stringify(item)
                  });
                  displayContentList.push(JSON.stringify([item]));
                }
              }

              previousLength = data.displayContentList.length;
            }

            if (data.isFinished) {
              isFinished = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }
    }

    return {
      displayContentList
    };
  } catch (error) {
    return Promise.reject(getErrText(error));
  }
}
