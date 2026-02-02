export const root = ['app'] as const;

export const http = {
  root: ['http'],
  req: ['http', 'req'],
  res: ['http', 'res'],
  rateLimiter: ['http', 'rate-limiter']
} as const;

export const middleware = {
  auth: ['middleware', 'auth']
} as const;

export const mod = {
  tool: ['mod', 'tool'],
  model: ['mod', 'model'],
  workflow: ['mod', 'workflow'],
  dataset: ['mod', 'dataset']
} as const;

export const infra = {
  mongo: ['infra', 'mongo'],
  redis: ['infra', 'redis'],
  storage: ['infra', 'storage'],
  pgvector: ['infra', 'pgvector'],
  bullmq: ['infra', 'bullmq'],
  aiProxy: ['infra', 'ai-proxy'],
  milvus: ['infra', 'milvus'],
  oceanbase: ['infra', 'oceanbase'],
  otel: ['infra', 'otel']
} as const;

export type LogCategory =
  | typeof root
  | (typeof http)[keyof typeof http]
  | (typeof middleware)[keyof typeof middleware]
  | (typeof mod)[keyof typeof mod]
  | (typeof infra)[keyof typeof infra];
