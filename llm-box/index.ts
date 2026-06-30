import { createCurlRequest } from '@fastgpt-plugin/sdk-factory/request';

const { request } = createCurlRequest({
  handler: () => import('./src/index').then((m) => m.default)
});

export default request;
