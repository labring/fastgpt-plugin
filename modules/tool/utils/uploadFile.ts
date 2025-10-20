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

      // Serialize buffer data to avoid transferList issues
      // Convert Buffer/Uint8Array to a plain object that can be safely cloned
      let serializedData: FileInput = data;
      if (data.buffer) {
        // Convert buffer to Uint8Array for safe serialization
        const bufferArray =
          data.buffer instanceof Uint8Array
            ? Array.from(data.buffer)
            : Array.from(Buffer.from(data.buffer));

        serializedData = {
          ...data,
          buffer: new Uint8Array(bufferArray) as Buffer
        };
      }

      parentPort?.postMessage({
        type: 'uploadFile',
        data: serializedData
      });
    });
  } else {
    const { fileUploadS3Server } = await import('@/s3');
    return await fileUploadS3Server.uploadFileAdvanced({
      ...data,
      ...(data.buffer ? { buffer: Buffer.from(data.buffer) } : {})
    });
  }
};
