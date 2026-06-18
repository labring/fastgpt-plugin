import os from 'node:os';
import path from 'node:path';

import z from 'zod';

export const FCRuntimeEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.coerce.number().int().positive().default(9000),
  PLUGIN_ID: z.string().min(1),
  PLUGIN_VERSION: z.string().min(1),
  PLUGIN_ETAG: z.string().min(1),
  PLUGIN_ARTIFACT_ENDPOINT: z.string().optional(),
  PLUGIN_ARTIFACT_BUCKET: z.string().min(1),
  PLUGIN_ARTIFACT_KEY: z.string().min(1),
  FASTGPT_BASE_URL: z.string().url(),
  FC_INVOKE_SIGNING_SECRET: z.string().min(1),
  LOG_LEVEL: z.string().default('info'),
  FASTGPT_PLUGIN_SDK_FACTORY_PATH: z.string().optional(),
  FC_RUNTIME_CACHE_DIR: z.string().default(path.join(os.tmpdir(), 'fastgpt-plugin-runtime'))
});

export type FCRuntimeEnv = z.infer<typeof FCRuntimeEnvSchema>;

export function loadFCRuntimeEnv(runtimeEnv = process.env): FCRuntimeEnv {
  return FCRuntimeEnvSchema.parse(runtimeEnv);
}

export function getRuntimeId(
  env: Pick<FCRuntimeEnv, 'PLUGIN_ETAG' | 'PLUGIN_ID' | 'PLUGIN_VERSION'>
) {
  return `fc@${env.PLUGIN_ID}@${env.PLUGIN_VERSION}@${env.PLUGIN_ETAG}`;
}
