import type { FileMetadata } from '@/s3/config';
import type { FileInput } from '@/s3/type';
import { parentPort } from 'worker_threads';
import { getNanoid } from './string';

export const uploadFile = async (data: FileInput) => {
  // 判断是否在 worker 线程中
  const isWorkerThread = typeof parentPort !== 'undefined' && parentPort !== null;

  if (isWorkerThread) {
    // 在 worker 线程中，通过 parentPort 发送消息
    return new Promise<FileMetadata>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject('Upload file timeout');
      }, 120000);

      if (!global.uploadFileResponseFnMap) {
        global.uploadFileResponseFnMap = new Map();
      }
      const fn = ({ data, error }: { data?: FileMetadata; error?: string }) => {
        clearTimeout(timer);
        global.uploadFileResponseFnMap.delete(id);
        if (error) {
          reject(error);
        } else if (data) {
          resolve(data);
        } else {
          reject('Unknow error');
        }
      };
      const id = getNanoid();
      global.uploadFileResponseFnMap.set(id, fn);

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
        data: {
          id,
          file: serializedData
        }
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
