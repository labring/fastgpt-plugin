// setup fetch Proxy
import { ProxyAgent, setGlobalDispatcher } from 'undici';
if (process.env.HTTP_PROXY) {
  const httpDispatcher = new ProxyAgent(process.env.HTTP_PROXY as string);
  setGlobalDispatcher(httpDispatcher);
}
