import { ProxyAgent, setGlobalDispatcher, fetch as undiciFetch } from 'undici';
import { addLog } from './log';
import { isProd } from '@/constants';
const httpProxy = process.env.HTTP_PROXY;
const httpsProxy = process.env.HTTPS_PROXY;

export function setupProxy() {
  const proxy = httpProxy || httpsProxy;
  if (proxy) {
    const proxyAgent = new ProxyAgent(proxy);
    setGlobalDispatcher(proxyAgent);

    // Replace global fetch with undici's fetch to ensure proxy is used
    if (isProd) {
      // Node
      global.fetch = ((input: any, init: any) => {
        return undiciFetch(input, init);
      }) as any;
    }

    addLog.info(`Using proxy: ${proxy}`);
  }
}
