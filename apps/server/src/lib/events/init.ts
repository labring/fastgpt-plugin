import { getCurrentToolPrefix } from '@/utils/context';
import { getPublicS3Server } from '../s3';
import { SubPub } from './class';
import { WorkerManager } from '../worker';
import type { SSEStreamingApi } from 'hono/streaming';
import { StreamMessageTypeEnum } from '@fastgpt-plugin/helpers/index';

export const createSubPub = ({ stream }: { stream?: SSEStreamingApi }) => {
  const sp = new SubPub();
  sp.on('file-upload', async (data) => {
    console.log('12312321321321321321');
    const publicS3Server = getPublicS3Server();
    const result = await publicS3Server.uploadFileAdvanced({
      ...data,
      ...(data.buffer ? { buffer: data.buffer } : {}),
      prefix: getCurrentToolPrefix()
    });
    console.log('upload file result', result);
    return result;
  });

  sp.on('cherrio2md', async ({ fetchUrl, html, selector }) => {
    const res = await WorkerManager.run('cherrio2md', {
      fetchUrl,
      html,
      selector
    });
    return res;
  });

  sp.on('html2md', async ({ html }) => {
    const res = await WorkerManager.run('html2md', {
      html
    });
    return res;
  });

  if (stream) {
    sp.on('stream-response', async (data) => {
      await stream.writeSSE({
        data: JSON.stringify({ type: StreamMessageTypeEnum.stream, data: data })
      });
    });
  }

  return sp;
};
