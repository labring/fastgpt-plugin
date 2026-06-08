# FastGPT Plugin Pool

Language: [简体中文](./README.md) | [English](./README.en.md)

An embeddable plugin process-pool library for existing services. Its naming and abstractions reference Kubernetes.

## Quick Start

### 1. Basic Usage

```typescript
import { PluginServiceManager } from './process_pool';

// Create manager
const manager = new PluginServiceManager({
  maxTotalPods: 50, // global max Pod count
});

// Register plugin service
await manager.registerService('weather', '/path/to/weather-plugin.js', {
  minPods: 2,
  maxPods: 10,
  podTimeout: 30000,
  maxConcurrentRequestsPerPod: 10,
});

// Invoke plugin
const result = await manager.invoke('weather', 'getTemperature', {
  city: 'Beijing',
});

console.log(result); // { city: 'Beijing', temperature: 25, unit: 'C' }

// Get metrics
const metrics = manager.getServiceMetrics('weather');
console.log(metrics.pods.total); // current Pod count

// Destroy manager
await manager.destroy();
```

### 2. Writing A Plugin

A plugin is an independent TypeScript/JavaScript file that communicates with the main process through IPC:

```typescript
// my-plugin.ts
import type { PluginMessage } from './types';

// 1. Send ready signal
process.send?.({
  version: '1.0',
  id: 'ready',
  type: 'ready',
  timestamp: Date.now(),
});

// 2. Listen for requests
process.on('message', async (message: PluginMessage) => {
  if (message.type !== 'request') return;

  try {
    // Execute business logic
    const result = await handleMethod(message.method, message.params);

    // Send response
    process.send?.({
      version: '1.0',
      id: message.id,
      type: 'response',
      result,
      timestamp: Date.now(),
      traceId: message.traceId,
    });
  } catch (error: any) {
    // Send error response
    process.send?.({
      version: '1.0',
      id: message.id,
      type: 'response',
      error: {
        code: 'PLUGIN_ERROR',
        message: error.message,
        stack: error.stack,
      },
      timestamp: Date.now(),
      traceId: message.traceId,
    });
  }
});

async function handleMethod(method: string, params: any) {
  switch (method) {
    case 'myMethod':
      return { success: true, data: params };
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}
```

## Core Concepts

### PluginServiceManager

Global manager for all plugin services:

- Register/unregister services
- Route requests to the corresponding service
- Global quota control
- Global metrics

### PluginService

Process-pool management for one plugin:

- Independent Pod pool and queue
- Automatic scale-out/scale-in
- Failure recovery
- Service-level monitoring

### PluginPod

Single worker process:

- IPC communication
- Lifecycle management
- Timeout control
- Request count

## Configuration

### Global Configuration

```typescript
interface GlobalConfig {
  maxTotalPods: number;        // global max Pod count, required
  healthCheckInterval?: number; // health check interval in milliseconds, default 30000
  idleTimeout: number;         // global Pod idle timeout in milliseconds
  maxRequestsPerPod: number;   // global max requests per Pod
  maxQueueSize: number;        // global max queue length
  queueTimeout: number;        // global queue wait timeout in milliseconds
  startupRetryBaseDelay: number; // startup timeout backoff base in milliseconds, default 1000
  startupRetryMaxDelay: number;  // startup timeout backoff max in milliseconds, default 10000
}
```

### Plugin-Level Service Configuration

```typescript
interface ServiceConfig {
  minPods: number;            // minimum Pod count
  maxPods: number;            // maximum Pod count
  podTimeout: number;         // Pod execution timeout in milliseconds
  maxConcurrentRequestsPerPod: number; // max concurrent requests per Pod
}
```

### Recommended Configuration

| Parameter | Suggested range | Description |
| --- | --- | --- |
| minPods | 1~2 | Use 2 for strong low-latency requirements |
| maxPods | 5~20 | Depends on CPU/memory |
| podTimeout | 10s~60s | Depends on plugin characteristics |
| maxConcurrentRequestsPerPod | 1~10 | Depends on plugin CPU/IO characteristics |

## Metrics

### Service-Level Metrics

```typescript
const metrics = manager.getServiceMetrics('weather');

console.log(metrics);
// {
//   pods: { total: 5, running: 5, busy: 2, idle: 3 },
//   queueLength: 10,
//   responseTime: { avg: 150, p95: 300 },
//   rps: 100,
//   errorRate: 0.01,
//   crashCount: 2,
//   totalRequests: 10000
// }
```

### Global Metrics

```typescript
const globalMetrics = manager.getGlobalMetrics();

console.log(globalMetrics);
// {
//   totalServices: 3,
//   totalPods: 15,
//   totalRequests: 50000,
//   avgResponseTime: 200,
//   errorRate: 0.02
// }
```

## Event System

### PluginService Events

```typescript
service.on('podReady', (info) => {
  console.log('Pod ready:', info.podId);
});

service.on('podCreated', (info) => {
  console.log('Pod created:', info.podId);
});

service.on('podDestroyed', (info) => {
  console.log('Pod destroyed:', info.podId);
});

service.on('podCrashed', (info, error) => {
  console.error('Pod crashed:', info.podId, error);
});

service.on('requestQueued', (requestId) => {
  console.log('Request queued:', requestId);
});

service.on('requestCompleted', ({ requestId, duration }) => {
  console.log('Request completed:', requestId, duration);
});

service.on('requestFailed', ({ requestId, error }) => {
  console.error('Request failed:', requestId, error);
});
```

### PluginServiceManager Events

```typescript
manager.on('serviceRegistered', ({ serviceName }) => {
  console.log('Service registered:', serviceName);
});

manager.on('serviceUnregistered', ({ serviceName }) => {
  console.log('Service unregistered:', serviceName);
});

manager.on('serviceUnhealthy', ({ serviceName, reason }) => {
  console.warn('Service unhealthy:', serviceName, reason);
});

manager.on('quotaExceeded', ({ requested, available }) => {
  console.warn('Quota exceeded:', requested, available);
});

manager.on('healthCheck', ({ timestamp, services }) => {
  console.log('Health check:', services);
});
```

## Advanced Usage

### Invocation Options

```typescript
// Custom timeout
await manager.invoke('weather', 'getTemperature', { city: 'Beijing' }, {
  timeout: 5000,
});

// Trace ID
await manager.invoke('weather', 'getTemperature', { city: 'Beijing' }, {
  traceId: 'trace-123',
});

// Priority, higher number means higher priority
await manager.invoke('weather', 'getTemperature', { city: 'Beijing' }, {
  priority: 10,
});
```

### Dynamic Configuration Update

```typescript
// Update service config
await manager.updateServiceConfig('weather', {
  minPods: 3,
  maxPods: 15,
  podTimeout: 30000,
  maxConcurrentRequestsPerPod: 10,
});
```

### Graceful Shutdown

```typescript
// Wait for all requests to complete
await manager.destroy();

// Force after timeout
await manager.destroy({
  force: false,
  timeout: 10000,
});

// Immediate force shutdown
await manager.destroy({
  force: true,
});
```

## Tests

Run tests:

```bash
bun run test
```

Test files:

- `plugin_service.test.ts`: single-plugin process-pool management tests.
- `plugin_service_manager.test.ts`: multi-plugin management tests.

## Architecture

```
Host Service
  ↓ direct call
PluginServiceManager
  ↓
PluginService(weather)   → queue(weather)   → PluginPod × M
PluginService(translate) → queue(translate) → PluginPod × N
...
```

### Key Features

- **Plugin isolation**: each plugin has an independent queue and pool.
- **Global quota**: the manager controls total quota across plugins.
- **Low latency**: warmup and reuse avoid cold starts.
- **Reliability**: timeout kill, crash replenishment, and queue protection.
- **Observability**: per-Service and global metrics.

## Failure Handling

### Execution Timeout

podTimeout expires while still busy -> kill and replenish.

### Process Crash

exit/error -> mark failed, release quota, and auto-replenish if below minPods.

### Queue Protection

maxQueueSize limit and queue wait timeout prevent permanent blocking.

## Best Practices

1. **Set minPods reasonably**: set it based on expected load to avoid cold starts.
2. **Control maxRequestsPerPod**: prevent memory leaks and fragmentation.
3. **Monitor metrics**: check errorRate and crashCount regularly.
4. **Global quota**: make sure maxTotalPods does not exhaust the host machine.
5. **Graceful shutdown**: use graceful shutdown in production to avoid losing requests.

## License

MIT
