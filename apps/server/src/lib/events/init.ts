import { Cherrio2MdPub, FileUploadPub, Html2MdPub } from '@fastgpt-plugin/helpers/events';
import { getPublicS3Server } from '../s3';
import { getCurrentToolPrefix } from '@/utils/context';
import { WorkerManager } from '../worker';

export const initEventsHandler = () => {
  FileUploadPub.register(async (data) => {
    const publicS3Server = getPublicS3Server();
    if (!publicS3Server) {
      throw new Error(
        'S3 Server not initialized in global context. If you are in dev mode, please ensure the system is initialized.'
      );
    }

    return await publicS3Server.uploadFileAdvanced({
      ...data,
      ...(data.buffer ? { buffer: data.buffer } : {}),
      prefix: getCurrentToolPrefix()
    });
  });

  Html2MdPub.register(async ({ html }) => {
    const res = await WorkerManager.run('html2md', {
      html
    });
    return res;
  });

  Cherrio2MdPub.register(async ({ fetchUrl, html, selector }) => {
    const res = await WorkerManager.run('cherrio2md', {
      fetchUrl,
      html,
      selector
    });
    return res;
  });
};
