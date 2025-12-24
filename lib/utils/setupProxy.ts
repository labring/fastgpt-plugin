import { setGlobalDispatcher, EnvHttpProxyAgent } from 'undici';

export function setupProxy() {
  const agent = new EnvHttpProxyAgent();
  setGlobalDispatcher(agent);
}
