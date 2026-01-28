import { setGlobalDispatcher, EnvHttpProxyAgent } from 'undici';
import { env } from '@/env';

export function configureProxy() {
  const agent = new EnvHttpProxyAgent();
  setGlobalDispatcher(agent);

  console.info('✓ HTTP_PROXY: %s', env.HTTP_PROXY);
  console.info('✓ HTTPS_PROXY: %s', env.HTTPS_PROXY);
  console.info('✓ NO_PROXY: %s', env.NO_PROXY);
  console.info('✓ ALL_PROXY: %s', env.ALL_PROXY);
}
