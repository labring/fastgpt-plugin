import type { FileMetadata } from '@/s3/config';
import type { FileInput } from '@/s3/type';
import { parentPort } from 'worker_threads';

export const uploadFile = async (data: FileInput) => {
  // 判断是否在 worker 线程中
  const isWorkerThread = typeof parentPort !== 'undefined' && parentPort !== null;
  console.log(parentPort, isWorkerThread, 1111);
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

      // Extract transferable objects (ArrayBuffer from Buffer/Uint8Array)
      const transferList: ArrayBuffer[] = [];
      if (data.buffer) {
        if (Buffer.isBuffer(data.buffer)) {
          const arrayBuffer = data.buffer.buffer.slice(
            data.buffer.byteOffset,
            data.buffer.byteOffset + data.buffer.byteLength
          );
          if (!(arrayBuffer instanceof SharedArrayBuffer)) {
            transferList.push(arrayBuffer);
          }
        } else if (data.buffer instanceof Uint8Array) {
          if (!(data.buffer.buffer instanceof SharedArrayBuffer)) {
            transferList.push(data.buffer.buffer);
          }
        }
      }

      parentPort?.postMessage(
        {
          type: 'uploadFile',
          data
        },
        transferList
      );
    });
  } else {
    const { fileUploadS3Server } = await import('@/s3');
    return await fileUploadS3Server.uploadFileAdvanced({
      ...data,
      ...(data.buffer ? { buffer: Buffer.from(data.buffer) } : {})
    });
  }
};
