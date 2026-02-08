import { getPublicS3Server } from '../s3';
import { SubPub } from './class';
import { WorkerManager } from '../worker';
import type { SSEStreamingApi } from 'hono/streaming';
import { StreamMessageTypeEnum } from '@fastgpt-plugin/helpers/index';
import { InvokeClient } from '@fastgpt-sdk/invoke';
import { env } from '@/env';

export const createSubPub = ({ stream }: { stream?: SSEStreamingApi }) => {
  const invokeClient = new InvokeClient(env.FASTGPT_BASE_URL);

  const sp = new SubPub();
  sp.on('file-upload', async ({ data, props }) => {
    const publicS3Server = getPublicS3Server();
    const result = await publicS3Server.uploadFileAdvanced({
      ...data,
      prefix: props.systemVar.tool.prefix
    });
    return result;
  });

  sp.on('cherrio2md', async ({ data: { fetchUrl, html, selector } }) => {
    const res = await WorkerManager.run('cherrio2md', {
      fetchUrl,
      html,
      selector
    });
    return res;
  });

  sp.on('html2md', async ({ data: { html } }) => {
    const res = await WorkerManager.run('html2md', {
      html
    });
    return res;
  });

  if (stream) {
    sp.on('stream-response', async ({ data }) => {
      await stream.writeSSE({
        data: JSON.stringify({ type: StreamMessageTypeEnum.stream, data })
      });
    });
  }

  sp.on('invoke', async ({ data: { type }, props }) => {
    const accessToken = props.systemVar.tool.accessToken;
    if (!accessToken) throw new Error('accessToken is required');
    switch (type) {
      case 'getTeamInfo':
        return invokeClient.getTeamInfo({ accessToken });
      case 'getUserInfo':
        return invokeClient.getUserInfo({ accessToken });
      case 'getWecomCorpToken':
        return invokeClient.getWecomCorpToken({ accessToken });
      case 'getWecomCorpInfo':
        return invokeClient.getWecomCorpInfo({ accessToken });
      default:
        return Promise.reject(new Error('Unknown invoke type'));
    }
  });

  return sp;
};
