import { ProxyAgent, setGlobalDispatcher } from 'undici';
const httpProxy = process.env.HTTP_PROXY;
const httpsProxy = process.env.HTTPS_PROXY;

export function setupProxy() {
  const proxy = httpProxy || httpsProxy;
  if (proxy) {
    const proxyAgent = new ProxyAgent(proxy);
    setGlobalDispatcher(proxyAgent);
  }
}
