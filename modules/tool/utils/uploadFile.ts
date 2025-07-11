import type { FileMetadata } from '@/s3/config';
import type { FileInput } from '@/s3/controller';
import { parentPort } from 'worker_threads';

export const uploadFile = async (data: FileInput) => {
  return new Promise<FileMetadata>((resolve, reject) => {
    global.uploadFileResponseFn = ({ data, error }) => {
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
};
