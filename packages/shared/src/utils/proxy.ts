import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';

let proxyConfigured = false;

export function hasProxyEnv(): boolean {
  return Boolean(
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.ALL_PROXY ||
    process.env.all_proxy
  );
}

export function getProxyEnv(): Record<string, string> {
  const proxyVars: Record<string, string> = {};
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const noProxy = process.env.NO_PROXY || process.env.no_proxy;
  const allProxy = process.env.ALL_PROXY || process.env.all_proxy;

  if (httpProxy) {
    proxyVars.HTTP_PROXY = httpProxy;
    proxyVars.http_proxy = httpProxy;
  }
  if (httpsProxy) {
    proxyVars.HTTPS_PROXY = httpsProxy;
    proxyVars.https_proxy = httpsProxy;
  }
  if (noProxy) {
    proxyVars.NO_PROXY = noProxy;
    proxyVars.no_proxy = noProxy;
  }
  if (allProxy) {
    proxyVars.ALL_PROXY = allProxy;
    proxyVars.all_proxy = allProxy;
  }

  return proxyVars;
}

export function configureGlobalProxy(): boolean {
  if (proxyConfigured) {
    return true;
  }

  if (!hasProxyEnv()) {
    return false;
  }

  const agent = new EnvHttpProxyAgent();
  setGlobalDispatcher(agent);
  proxyConfigured = true;
  return true;
}

export function resetGlobalProxyForTest(): void {
  proxyConfigured = false;
}
