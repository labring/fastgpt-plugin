import { initClient } from '@ts-rest/core';
import { contract } from './index';

export default function createClient({ baseUrl, token }: { baseUrl: string; token: string }) {
  return initClient(contract, {
    baseUrl,
    baseHeaders: {
      authtoken: token
    }
  });
}
