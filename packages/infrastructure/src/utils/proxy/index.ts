import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';

import { env } from '../../env';

type ProxyEnv = {
  HTTP_PROXY?: string;
  HTTPS_PROXY?: string;
  NO_PROXY?: string;
  ALL_PROXY?: string;
};

export function configureProxy(runtimeEnv: ProxyEnv = env) {
  const agent = new EnvHttpProxyAgent();
  setGlobalDispatcher(agent);

  console.info('✓ HTTP_PROXY: %s', runtimeEnv.HTTP_PROXY);
  console.info('✓ HTTPS_PROXY: %s', runtimeEnv.HTTPS_PROXY);
  console.info('✓ NO_PROXY: %s', runtimeEnv.NO_PROXY);
  console.info('✓ ALL_PROXY: %s', runtimeEnv.ALL_PROXY);
}
