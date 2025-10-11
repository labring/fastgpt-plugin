import { fileUploadS3Server } from '@/s3';
import type { FileMetadata } from '@/s3/config';
import type { FileInput } from '@/s3/type';
import { parentPort } from 'worker_threads';

export const uploadFile = async (data: FileInput) => {
  // 判断是否在 worker 线程中
  const isWorkerThread = typeof parentPort !== 'undefined' && parentPort !== null;

  if (isWorkerThread) {
    // 在 worker 线程中，通过 parentPort 发送消息
    return new Promise<FileMetadata>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject('Upload file timeout');
      }, 120000);
      global.uploadFileResponseFn = ({ data, error }) => {
        clearTimeout(timer);
        if (error) {
          reject(error);
        } else if (data) {
          resolve(data);
        } else {
          reject('Unknow error');
        }
      };
      parentPort?.postMessage({
        type: 'uploadFile',
        data
      });
    });
  } else {
    return await fileUploadS3Server.uploadFileAdvanced({
      ...data,
      ...(data.buffer ? { buffer: Buffer.from(data.buffer) } : {})
    });
  }
};
