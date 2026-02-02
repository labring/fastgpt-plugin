import { parentPort } from 'worker_threads';
import { workerResponse } from '@tool/worker/utils';
import { html2md } from './utils';

parentPort?.on('message', (params: { html: string }) => {
  try {
    workerResponse({
      parentPort,
      status: 'success',
      data: html2md(params.html)
    });
  } catch (error) {
    workerResponse({
      parentPort,
      status: 'error',
      data: error
    });
  }
});
