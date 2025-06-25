import { parentPort } from 'worker_threads';

export const uploadFile = async (data: any) => {
  return new Promise((resolve, reject) => {
    global.uploadFileResponseFn = (res: any) => {
      resolve(res);
    };
    parentPort?.postMessage({
      type: 'uploadFile',
      data
    });
  });
};

declare global {
  // eslint-disable-next-line no-var
  var uploadFileResponseFn: (data: any) => void | undefined;
}

export {};
