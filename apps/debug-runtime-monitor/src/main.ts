type EnvValue = string | boolean | undefined;

type RuntimeConfig = {
  baseUrl: string;
  token: string;
  metricsPath: string;
  pollIntervalMs: number;
};

type RuntimeConfigSource = Partial<Omit<RuntimeConfig, 'pollIntervalMs'>> & {
  baseurl?: string;
  pollIntervalMs?: number | string;
};

type RuntimeMetricsResponse = {
  data?: MetricsPayload;
  error?: {
    en?: string;
    'zh-CN'?: string;
    'zh-Hant'?: string;
  };
};

type MetricsPayload = GlobalMetrics | ConnectionGatewayMetrics;

type GlobalMetrics = {
  totalServices?: number;
  totalPods?: number;
  totalRequests?: number;
  services?: Record<string, ServiceMetrics>;
};

type ServiceMetrics = {
  pods?: PodStats;
  queueLength?: number;
  responseTime?: ResponseTimeStats;
  rps?: number;
  errorRate?: number;
  crashCount?: number;
  totalRequests?: number;
  minPods?: number;
  maxPods?: number;
};

type PodStats = {
  total?: number;
  running?: number;
  busy?: number;
  idle?: number;
  pending?: number;
};

type ResponseTimeStats = {
  avg?: number;
  p95?: number;
  p99?: number;
};

type ConnectionGatewayMetrics = {
  nodeId?: string;
  activeConnections?: number;
  activeSessions?: number;
  inFlightRequests?: number;
  streamBufferBytes?: number;
  slowConsumers?: number;
  ownerLeaseExpiries?: number;
  mailbox?: {
    lag?: number;
    redisRoundTripMs?: number;
  };
  limits?: {
    maxConnections?: number;
    maxSessionsPerSubject?: number;
    maxInFlightPerSession?: number;
    maxEnvelopeBytes?: number;
  };
};

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error' | 'missing-config';
type SortMode = 'risk' | 'requests' | 'latency' | 'name';
type ServiceLevel = 'critical' | 'warning' | 'active' | 'idle';
type MetricsKind = 'runtime' | 'gateway';

type ServiceView = {
  id: string;
  pool: string;
  name: string;
  version: string;
  hash: string;
  metrics: RequiredServiceMetrics;
  level: ServiceLevel;
  riskScore: number;
};

type RequiredServiceMetrics = {
  pods: Required<PodStats>;
  queueLength: number;
  responseTime: Required<ResponseTimeStats>;
  rps: number;
  errorRate: number;
  crashCount: number;
  totalRequests: number;
  minPods: number;
  maxPods: number;
};

type RuntimeState = {
  autoRefresh: boolean;
  errorMessage: string;
  filter: string;
  lastLatencyMs: number | null;
  lastUpdatedAt: Date | null;
  metrics: MetricsPayload | null;
  sortMode: SortMode;
  status: LoadStatus;
};

declare global {
  interface Window {
    __DEBUG_RUNTIME_MONITOR_CONFIG__?: RuntimeConfigSource;
  }
}

const env = ((import.meta as ImportMeta & { env?: Record<string, EnvValue> }).env ?? {}) as Record<
  string,
  EnvValue
>;
const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app');
}

const rootElement = app;
let config = normalizeRuntimeConfig({});
const state: RuntimeState = {
  autoRefresh: true,
  errorMessage: '',
  filter: '',
  lastLatencyMs: null,
  lastUpdatedAt: null,
  metrics: null,
  sortMode: 'risk',
  status: 'idle'
};
let refreshTimer: number | undefined;

render();
void boot();

async function boot(): Promise<void> {
  config = await readRuntimeConfig();
  state.status = config.baseUrl ? 'idle' : 'missing-config';
  render();
  configureAutoRefresh();

  if (config.baseUrl) {
    await refreshMetrics();
  }
}

async function readRuntimeConfig(): Promise<RuntimeConfig> {
  const local = readLocalRuntimeConfig();
  const runtime = await readServerRuntimeConfig();

  return normalizeRuntimeConfig(mergeConfig(local, runtime));
}

function readLocalRuntimeConfig(): RuntimeConfigSource {
  const configuredRuntimeBaseUrl = pickValue(
    window.__DEBUG_RUNTIME_MONITOR_CONFIG__?.baseUrl ??
      window.__DEBUG_RUNTIME_MONITOR_CONFIG__?.baseurl,
    readEnv('RUNTIME_BASE_URL', 'RUNTIME_BASEURL', 'VITE_RUNTIME_BASE_URL', 'VITE_RUNTIME_BASEURL')
  );
  const gatewayBaseUrl = readEnv(
    'CONNECTION_GATEWAY_BASE_URL',
    'VITE_CONNECTION_GATEWAY_BASE_URL'
  );
  const configuredMetricsPath = pickValue(
    window.__DEBUG_RUNTIME_MONITOR_CONFIG__?.metricsPath ??
      readEnv('RUNTIME_METRICS_PATH', 'VITE_RUNTIME_METRICS_PATH')
  );

  return {
    ...window.__DEBUG_RUNTIME_MONITOR_CONFIG__,
    baseUrl: pickValue(configuredRuntimeBaseUrl, gatewayBaseUrl),
    token: pickValue(
      window.__DEBUG_RUNTIME_MONITOR_CONFIG__?.token,
      readEnv(
        'RUNTIME_TOKEN',
        'VITE_RUNTIME_TOKEN',
        'CONNECTION_GATEWAY_AUTH_TOKEN',
        'VITE_CONNECTION_GATEWAY_AUTH_TOKEN'
      )
    ),
    metricsPath: pickValue(
      configuredMetricsPath,
      gatewayBaseUrl && !configuredRuntimeBaseUrl ? '/metrics' : undefined
    ),
    pollIntervalMs:
      window.__DEBUG_RUNTIME_MONITOR_CONFIG__?.pollIntervalMs ??
      readEnv('RUNTIME_POLL_INTERVAL_MS', 'VITE_RUNTIME_POLL_INTERVAL_MS')
  };
}

async function readServerRuntimeConfig(): Promise<RuntimeConfigSource> {
  try {
    const response = await fetch('/runtime-config.json', { cache: 'no-store' });

    if (!response.ok) {
      return {};
    }

    const payload = (await response.json()) as unknown;
    return isRuntimeConfigSource(payload) ? payload : {};
  } catch {
    return {};
  }
}

function isRuntimeConfigSource(value: unknown): value is RuntimeConfigSource {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mergeConfig(
  local: RuntimeConfigSource,
  runtime: RuntimeConfigSource
): RuntimeConfigSource {
  return {
    baseUrl: pickValue(runtime.baseUrl, runtime.baseurl, local.baseUrl, local.baseurl),
    token: pickValue(runtime.token, local.token),
    metricsPath: pickValue(runtime.metricsPath, local.metricsPath),
    pollIntervalMs: pickValue(runtime.pollIntervalMs, local.pollIntervalMs)
  };
}

function pickValue<T>(...values: Array<T | undefined>): T | undefined {
  return values.find((value) => value !== undefined && String(value).trim() !== '');
}

function normalizeRuntimeConfig(source: RuntimeConfigSource): RuntimeConfig {
  const baseUrl = trimValue(source.baseUrl ?? source.baseurl);
  const token = trimValue(source.token);
  const metricsPath = trimValue(source.metricsPath);
  const pollIntervalRaw = trimValue(String(source.pollIntervalMs ?? ''));
  const pollIntervalMs = Number.parseInt(pollIntervalRaw, 10);

  return {
    baseUrl,
    token,
    metricsPath: metricsPath || '/api/runtime/metrics',
    pollIntervalMs:
      Number.isFinite(pollIntervalMs) && pollIntervalMs >= 1000 ? pollIntervalMs : 3000
  };
}

function readEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = env[key];

    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return '';
}

function trimValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

async function refreshMetrics(): Promise<void> {
  if (!config.baseUrl) {
    state.status = 'missing-config';
    render();
    return;
  }

  state.status = 'loading';
  state.errorMessage = '';
  render();

  const startedAt = performance.now();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(makeMetricsUrl(config), {
      cache: 'no-store',
      headers: makeHeaders(config.token),
      signal: controller.signal
    });
    const payload = (await response.json()) as RuntimeMetricsResponse;

    if (!response.ok) {
      throw new Error(readResponseError(payload) || `HTTP ${response.status}`);
    }

    if (!payload.data || typeof payload.data !== 'object') {
      throw new Error('Metrics response missing data');
    }

    state.metrics = payload.data;
    state.status = 'ready';
    state.lastUpdatedAt = new Date();
    state.lastLatencyMs = Math.round(performance.now() - startedAt);
  } catch (error) {
    state.status = 'error';
    state.errorMessage = normalizeError(error);
  } finally {
    window.clearTimeout(timeout);
    render();
  }
}

function makeHeaders(token: string): Headers {
  const headers = new Headers({
    Accept: 'application/json'
  });

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

function makeMetricsUrl(runtimeConfig: RuntimeConfig): string {
  const baseUrl = runtimeConfig.baseUrl.endsWith('/')
    ? runtimeConfig.baseUrl
    : `${runtimeConfig.baseUrl}/`;
  const path = runtimeConfig.metricsPath.startsWith('/')
    ? runtimeConfig.metricsPath.slice(1)
    : runtimeConfig.metricsPath;

  return new URL(path, baseUrl).toString();
}

function readResponseError(payload: RuntimeMetricsResponse): string {
  return payload.error?.['zh-CN'] ?? payload.error?.en ?? payload.error?.['zh-Hant'] ?? '';
}

function normalizeError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return '请求超时';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '未知错误';
}

function configureAutoRefresh(): void {
  if (refreshTimer) {
    window.clearInterval(refreshTimer);
  }

  if (!state.autoRefresh || !config.baseUrl) {
    refreshTimer = undefined;
    return;
  }

  refreshTimer = window.setInterval(() => {
    void refreshMetrics();
  }, config.pollIntervalMs);
}

function render(): void {
  const metricsKind = getMetricsKind(state.metrics, config);
  const services = metricsKind === 'runtime' ? getVisibleServices() : [];
  const runtimeSummary = metricsKind === 'runtime' ? getRuntimeSummary(services) : null;
  const gatewayMetrics = metricsKind === 'gateway' ? normalizeGatewayMetrics(state.metrics) : null;

  rootElement.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div class="brand">
          <p class="eyebrow">FastGPT Plugin</p>
          <h1>Debug Runtime Monitor</h1>
          <div class="connection">
            <span>${escapeHtml(config.baseUrl || 'baseurl 未配置')}</span>
            <span>${config.token ? 'token 已配置' : 'token 未配置'}</span>
            <span>${escapeHtml(config.metricsPath)}</span>
            <span>${metricsKind === 'gateway' ? 'gateway' : 'runtime'}</span>
          </div>
        </div>
        <div class="statusGroup">
          ${renderStatusBadge()}
          <button class="button" id="refreshButton" type="button" ${isRefreshDisabled() ? 'disabled' : ''}>刷新</button>
        </div>
      </header>

      ${renderNotice()}

      ${renderToolbar(metricsKind)}
      ${metricsKind === 'gateway' && gatewayMetrics ? renderGatewayDashboard(gatewayMetrics) : renderRuntimeDashboard(services, runtimeSummary)}
    </main>
  `;

  bindEvents();
}

function bindEvents(): void {
  document.querySelector<HTMLButtonElement>('#refreshButton')?.addEventListener('click', () => {
    void refreshMetrics();
  });

  document.querySelector<HTMLInputElement>('#serviceFilter')?.addEventListener('input', (event) => {
    state.filter = (event.currentTarget as HTMLInputElement).value;
    render();
  });

  document.querySelector<HTMLSelectElement>('#sortMode')?.addEventListener('change', (event) => {
    state.sortMode = (event.currentTarget as HTMLSelectElement).value as SortMode;
    render();
  });

  document.querySelector<HTMLInputElement>('#autoRefresh')?.addEventListener('change', (event) => {
    state.autoRefresh = (event.currentTarget as HTMLInputElement).checked;
    configureAutoRefresh();
    render();
  });
}

function renderToolbar(metricsKind: MetricsKind): string {
  if (metricsKind === 'gateway') {
    return `
      <section class="toolbar toolbarGateway" aria-label="Gateway 刷新">
        <label class="toggle">
          <input id="autoRefresh" type="checkbox" ${state.autoRefresh ? 'checked' : ''} />
          <span>自动刷新</span>
        </label>
      </section>
    `;
  }

  return `
    <section class="toolbar" aria-label="服务筛选">
      <input id="serviceFilter" class="searchInput" type="search" placeholder="筛选服务" value="${escapeAttribute(
        state.filter
      )}" />
      <select id="sortMode" class="selectInput" aria-label="排序">
        ${renderSortOption('risk', '风险优先')}
        ${renderSortOption('requests', '请求数')}
        ${renderSortOption('latency', '响应耗时')}
        ${renderSortOption('name', '名称')}
      </select>
      <label class="toggle">
        <input id="autoRefresh" type="checkbox" ${state.autoRefresh ? 'checked' : ''} />
        <span>自动刷新</span>
      </label>
    </section>
  `;
}

function isRefreshDisabled(): boolean {
  return !config.baseUrl || state.status === 'loading';
}

function renderSortOption(value: SortMode, label: string): string {
  return `<option value="${value}" ${state.sortMode === value ? 'selected' : ''}>${label}</option>`;
}

function renderStatusBadge(): string {
  const labelMap: Record<LoadStatus, string> = {
    idle: '等待连接',
    loading: '请求中',
    ready: '已连接',
    error: '请求失败',
    'missing-config': '未配置'
  };

  return `<span class="statusBadge status-${state.status}">${labelMap[state.status]}</span>`;
}

function renderNotice(): string {
  if (state.status === 'missing-config') {
    return `
      <section class="notice notice-warning">
        <strong>缺少 baseurl</strong>
        <span>设置 RUNTIME_BASE_URL 或 CONNECTION_GATEWAY_BASE_URL 后启动。</span>
      </section>
    `;
  }

  if (state.status === 'error') {
    return `
      <section class="notice notice-danger">
        <strong>Metrics 请求失败</strong>
        <span>${escapeHtml(state.errorMessage)}</span>
      </section>
    `;
  }

  const updated = state.lastUpdatedAt ? formatTime(state.lastUpdatedAt) : '尚未刷新';
  const latency = state.lastLatencyMs === null ? '-' : `${state.lastLatencyMs} ms`;

  return `
    <section class="notice">
      <strong>Metrics</strong>
      <span>${updated}</span>
      <span>${latency}</span>
      <span>${formatInterval(config.pollIntervalMs)}</span>
    </section>
  `;
}

function renderRuntimeDashboard(
  services: ServiceView[],
  summary: ReturnType<typeof getRuntimeSummary> | null
): string {
  const viewSummary =
    summary ??
    ({
      totalServices: 0,
      totalPods: 0,
      totalRequests: 0,
      busyPods: 0,
      rps: 0,
      queueLength: 0,
      crashCount: 0,
      errorServices: 0
    } satisfies ReturnType<typeof getRuntimeSummary>);

  return `
    <section class="summaryGrid" aria-label="运行总览">
      ${renderSummaryCard('服务', viewSummary.totalServices)}
      ${renderSummaryCard('Pods', viewSummary.totalPods)}
      ${renderSummaryCard('Busy Pods', viewSummary.busyPods)}
      ${renderSummaryCard('请求', viewSummary.totalRequests)}
      ${renderSummaryCard('RPS', formatDecimal(viewSummary.rps))}
      ${renderSummaryCard('队列', viewSummary.queueLength)}
      ${renderSummaryCard('错误服务', viewSummary.errorServices)}
      ${renderSummaryCard('崩溃', viewSummary.crashCount)}
    </section>

    <section class="serviceSection">
      <div class="sectionHeader">
        <h2>Services</h2>
        <span>${services.length} / ${viewSummary.totalServices}</span>
      </div>
      ${renderServices(services)}
    </section>
  `;
}

function renderGatewayDashboard(metrics: RequiredConnectionGatewayMetrics): string {
  return `
    <section class="summaryGrid" aria-label="Gateway 总览">
      ${renderSummaryCard('Connections', metrics.activeConnections)}
      ${renderSummaryCard('Sessions', metrics.activeSessions)}
      ${renderSummaryCard('In-flight', metrics.inFlightRequests)}
      ${renderSummaryCard('Mailbox Lag', metrics.mailbox.lag)}
      ${renderSummaryCard('Redis RTT', formatMs(metrics.mailbox.redisRoundTripMs))}
      ${renderSummaryCard('Slow Consumers', metrics.slowConsumers)}
      ${renderSummaryCard('Lease Expiries', metrics.ownerLeaseExpiries)}
      ${renderSummaryCard('Buffer', formatBytes(metrics.streamBufferBytes))}
    </section>

    <section class="gatewaySection">
      <div class="sectionHeader">
        <h2>Connection Gateway</h2>
        <span>${escapeHtml(metrics.nodeId || '-')}</span>
      </div>
      <div class="gatewayGrid">
        ${renderGatewayLimit('Connection Capacity', metrics.activeConnections, metrics.limits.maxConnections)}
        ${renderGatewayMetric('Max Sessions / Subject', metrics.limits.maxSessionsPerSubject)}
        ${renderGatewayMetric('Max In-flight / Session', metrics.limits.maxInFlightPerSession)}
        ${renderGatewayMetric('Max Envelope', formatBytes(metrics.limits.maxEnvelopeBytes))}
        ${renderGatewayMetric('Mailbox Lag', metrics.mailbox.lag)}
        ${renderGatewayMetric('Redis RTT', formatMs(metrics.mailbox.redisRoundTripMs))}
        ${renderGatewayMetric('Slow Consumers', metrics.slowConsumers)}
        ${renderGatewayMetric('Owner Lease Expiries', metrics.ownerLeaseExpiries)}
      </div>
    </section>
  `;
}

function renderGatewayLimit(
  label: string,
  value: number,
  limit: number,
  bytes = false
): string {
  const capacity = Math.max(limit, 1);
  const width = toBarWidth(value, capacity);
  const displayValue = bytes ? formatBytes(value) : value;
  const displayLimit = bytes ? formatBytes(limit) : limit;

  return `
    <article class="gatewayMetric">
      <div class="gatewayMetricHead">
        <span>${label}</span>
        <strong>${escapeHtml(String(displayValue))}</strong>
      </div>
      <div class="capacityBar" aria-label="${escapeAttribute(label)} capacity">
        <span style="width: ${width}%"></span>
      </div>
      <p>${escapeHtml(String(displayLimit))}</p>
    </article>
  `;
}

function renderGatewayMetric(label: string, value: string | number): string {
  return `
    <article class="gatewayMetric">
      <div class="gatewayMetricHead">
        <span>${label}</span>
        <strong>${escapeHtml(String(value))}</strong>
      </div>
    </article>
  `;
}

function renderSummaryCard(label: string, value: string | number): string {
  return `
    <article class="metricCard">
      <span>${label}</span>
      <strong>${escapeHtml(String(value))}</strong>
    </article>
  `;
}

function renderServices(services: ServiceView[]): string {
  if (!config.baseUrl) {
    return '<div class="emptyState">等待 baseurl</div>';
  }

  if (state.status === 'loading' && !state.metrics) {
    return '<div class="emptyState">正在读取 metrics</div>';
  }

  if (!services.length) {
    return '<div class="emptyState">暂无服务</div>';
  }

  return `<div class="serviceGrid">${services.map(renderServiceCard).join('')}</div>`;
}

function renderServiceCard(service: ServiceView): string {
  const metrics = service.metrics;
  const podCapacity = Math.max(metrics.maxPods, metrics.pods.total, 1);
  const busyWidth = toBarWidth(metrics.pods.busy, podCapacity);
  const idleWidth = toBarWidth(metrics.pods.idle, podCapacity);
  const pendingWidth = toBarWidth(metrics.pods.pending, podCapacity);
  const runningWidth = toBarWidth(metrics.pods.running, podCapacity);

  return `
    <article class="serviceCard level-${service.level}">
      <div class="serviceHead">
        <div>
          <h3>${escapeHtml(service.name)}</h3>
          <p>${escapeHtml(service.pool)} · v${escapeHtml(service.version)} · ${escapeHtml(service.hash)}</p>
        </div>
        <span class="levelBadge">${getLevelLabel(service.level)}</span>
      </div>

      <div class="serviceNumbers">
        ${renderServiceNumber('请求', metrics.totalRequests)}
        ${renderServiceNumber('RPS', formatDecimal(metrics.rps))}
        ${renderServiceNumber('队列', metrics.queueLength)}
        ${renderServiceNumber('错误率', formatPercent(metrics.errorRate))}
        ${renderServiceNumber('崩溃', metrics.crashCount)}
      </div>

      <div class="latencyLine">
        <span>avg ${formatMs(metrics.responseTime.avg)}</span>
        <span>p95 ${formatMs(metrics.responseTime.p95)}</span>
        <span>p99 ${formatMs(metrics.responseTime.p99)}</span>
      </div>

      <div class="podLine">
        <div class="podBar" aria-label="pod 状态">
          <span class="podSegment pod-busy" style="width: ${busyWidth}%"></span>
          <span class="podSegment pod-running" style="width: ${runningWidth}%"></span>
          <span class="podSegment pod-idle" style="width: ${idleWidth}%"></span>
          <span class="podSegment pod-pending" style="width: ${pendingWidth}%"></span>
        </div>
        <div class="podMeta">
          <span>${metrics.pods.total}/${metrics.maxPods} pods</span>
          <span>${metrics.pods.busy} busy</span>
          <span>${metrics.pods.pending} pending</span>
        </div>
      </div>
    </article>
  `;
}

function renderServiceNumber(label: string, value: string | number): string {
  return `
    <div>
      <span>${label}</span>
      <strong>${escapeHtml(String(value))}</strong>
    </div>
  `;
}

function getVisibleServices(): ServiceView[] {
  const source = getRuntimeMetrics(state.metrics)?.services ?? {};
  const filter = state.filter.trim().toLowerCase();
  const services = Object.entries(source).map(([id, metrics]) => makeServiceView(id, metrics));
  const filtered = filter
    ? services.filter((service) =>
        `${service.id} ${service.name} ${service.version}`.toLowerCase().includes(filter)
      )
    : services;

  return filtered.sort(compareServices);
}

function makeServiceView(id: string, metrics: ServiceMetrics): ServiceView {
  const [pool = 'runtime', name = id, version = '-', hash = '-'] = id.split('@');
  const normalized = normalizeServiceMetrics(metrics);
  const level = getServiceLevel(normalized);

  return {
    id,
    pool,
    name,
    version,
    hash,
    metrics: normalized,
    level,
    riskScore: getRiskScore(normalized, level)
  };
}

function normalizeServiceMetrics(metrics: ServiceMetrics): RequiredServiceMetrics {
  return {
    pods: {
      total: toNumber(metrics.pods?.total),
      running: toNumber(metrics.pods?.running),
      busy: toNumber(metrics.pods?.busy),
      idle: toNumber(metrics.pods?.idle),
      pending: toNumber(metrics.pods?.pending)
    },
    queueLength: toNumber(metrics.queueLength),
    responseTime: {
      avg: toNumber(metrics.responseTime?.avg),
      p95: toNumber(metrics.responseTime?.p95),
      p99: toNumber(metrics.responseTime?.p99)
    },
    rps: toNumber(metrics.rps),
    errorRate: toNumber(metrics.errorRate),
    crashCount: toNumber(metrics.crashCount),
    totalRequests: toNumber(metrics.totalRequests),
    minPods: toNumber(metrics.minPods),
    maxPods: Math.max(toNumber(metrics.maxPods), toNumber(metrics.pods?.total), 1)
  };
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function getServiceLevel(metrics: RequiredServiceMetrics): ServiceLevel {
  if (metrics.crashCount > 0 || metrics.errorRate > 0) {
    return 'critical';
  }

  if (metrics.queueLength > 0 || metrics.pods.pending > 0 || metrics.pods.total < metrics.minPods) {
    return 'warning';
  }

  if (metrics.pods.busy > 0 || metrics.rps > 0) {
    return 'active';
  }

  return 'idle';
}

function getRiskScore(metrics: RequiredServiceMetrics, level: ServiceLevel): number {
  const levelScore: Record<ServiceLevel, number> = {
    critical: 4000,
    warning: 3000,
    active: 2000,
    idle: 1000
  };

  return (
    levelScore[level] +
    metrics.crashCount * 100 +
    metrics.errorRate * 50 +
    metrics.queueLength * 10 +
    metrics.pods.pending
  );
}

function compareServices(a: ServiceView, b: ServiceView): number {
  if (state.sortMode === 'name') {
    return a.name.localeCompare(b.name);
  }

  if (state.sortMode === 'requests') {
    return b.metrics.totalRequests - a.metrics.totalRequests || a.name.localeCompare(b.name);
  }

  if (state.sortMode === 'latency') {
    return b.metrics.responseTime.p95 - a.metrics.responseTime.p95 || a.name.localeCompare(b.name);
  }

  return (
    b.riskScore - a.riskScore ||
    b.metrics.totalRequests - a.metrics.totalRequests ||
    a.name.localeCompare(b.name)
  );
}

function getRuntimeSummary(services: ServiceView[]) {
  const metrics = getRuntimeMetrics(state.metrics);
  const sourceServices = Object.values(metrics?.services ?? {}).map(normalizeServiceMetrics);
  const visibleMetrics = services.map((service) => service.metrics);
  const totalServices = metrics?.totalServices ?? sourceServices.length;
  const totalPods = metrics?.totalPods ?? sum(sourceServices, (item) => item.pods.total);
  const totalRequests = metrics?.totalRequests ?? sum(sourceServices, (item) => item.totalRequests);

  return {
    totalServices,
    totalPods,
    totalRequests,
    busyPods: sum(sourceServices, (item) => item.pods.busy),
    rps: sum(sourceServices, (item) => item.rps),
    queueLength: sum(sourceServices, (item) => item.queueLength),
    crashCount: sum(sourceServices, (item) => item.crashCount),
    errorServices: visibleMetrics.filter((item) => item.errorRate > 0 || item.crashCount > 0).length
  };
}

type RequiredConnectionGatewayMetrics = {
  nodeId: string;
  activeConnections: number;
  activeSessions: number;
  inFlightRequests: number;
  streamBufferBytes: number;
  slowConsumers: number;
  ownerLeaseExpiries: number;
  mailbox: {
    lag: number;
    redisRoundTripMs: number;
  };
  limits: {
    maxConnections: number;
    maxSessionsPerSubject: number;
    maxInFlightPerSession: number;
    maxEnvelopeBytes: number;
  };
};

function getMetricsKind(metrics: MetricsPayload | null, runtimeConfig: RuntimeConfig): MetricsKind {
  if (isConnectionGatewayMetrics(metrics)) {
    return 'gateway';
  }

  if (metrics) {
    return 'runtime';
  }

  return runtimeConfig.metricsPath.replace(/\/+$/, '') === '/metrics' ? 'gateway' : 'runtime';
}

function getRuntimeMetrics(metrics: MetricsPayload | null): GlobalMetrics | null {
  return isConnectionGatewayMetrics(metrics) ? null : metrics;
}

function isConnectionGatewayMetrics(metrics: MetricsPayload | null): metrics is ConnectionGatewayMetrics {
  return Boolean(
    metrics &&
      typeof metrics === 'object' &&
      ('activeConnections' in metrics ||
        'activeSessions' in metrics ||
        ('nodeId' in metrics && 'mailbox' in metrics))
  );
}

function normalizeGatewayMetrics(metrics: MetricsPayload | null): RequiredConnectionGatewayMetrics {
  const source = isConnectionGatewayMetrics(metrics) ? metrics : {};

  return {
    nodeId: trimValue(source.nodeId),
    activeConnections: toNumber(source.activeConnections),
    activeSessions: toNumber(source.activeSessions),
    inFlightRequests: toNumber(source.inFlightRequests),
    streamBufferBytes: toNumber(source.streamBufferBytes),
    slowConsumers: toNumber(source.slowConsumers),
    ownerLeaseExpiries: toNumber(source.ownerLeaseExpiries),
    mailbox: {
      lag: toNumber(source.mailbox?.lag),
      redisRoundTripMs: toNumber(source.mailbox?.redisRoundTripMs)
    },
    limits: {
      maxConnections: Math.max(1, toNumber(source.limits?.maxConnections)),
      maxSessionsPerSubject: Math.max(1, toNumber(source.limits?.maxSessionsPerSubject)),
      maxInFlightPerSession: Math.max(1, toNumber(source.limits?.maxInFlightPerSession)),
      maxEnvelopeBytes: Math.max(1, toNumber(source.limits?.maxEnvelopeBytes))
    }
  };
}

function sum<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((total, item) => total + selector(item), 0);
}

function toBarWidth(value: number, capacity: number): number {
  if (value <= 0 || capacity <= 0) {
    return 0;
  }

  return Math.max(4, Math.min(100, (value / capacity) * 100));
}

function getLevelLabel(level: ServiceLevel): string {
  const labels: Record<ServiceLevel, string> = {
    critical: '异常',
    warning: '排队',
    active: '运行中',
    idle: '空闲'
  };

  return labels[level];
}

function formatDecimal(value: number): string {
  if (Math.abs(value) >= 100) {
    return value.toFixed(0);
  }

  if (Math.abs(value) >= 10) {
    return value.toFixed(1);
  }

  return value.toFixed(2).replace(/\.?0+$/, '');
}

function formatPercent(value: number): string {
  const percent = value <= 1 ? value * 100 : value;
  return `${formatDecimal(percent)}%`;
}

function formatMs(value: number): string {
  return `${Math.round(value)} ms`;
}

function formatBytes(value: number): string {
  if (value >= 1024 * 1024) {
    return `${formatDecimal(value / (1024 * 1024))} MiB`;
  }

  if (value >= 1024) {
    return `${formatDecimal(value / 1024)} KiB`;
  }

  return `${Math.round(value)} B`;
}

function formatTime(value: Date): string {
  return value.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatInterval(value: number): string {
  return `${Math.round(value / 1000)}s`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('`', '&#96;');
}

export {};
