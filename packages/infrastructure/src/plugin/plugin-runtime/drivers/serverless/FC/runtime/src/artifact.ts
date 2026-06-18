import fs from 'node:fs/promises';

import { createStorage, type IStorageOptions } from '@fastgpt-sdk/storage';

import type { FCRuntimeEnv } from './env';

export function createArtifactDownloader(env: FCRuntimeEnv) {
  const client = createStorage({
    vendor: 'oss',
    bucket: env.PLUGIN_ARTIFACT_BUCKET,
    endpoint: env.PLUGIN_ARTIFACT_ENDPOINT ?? '',
    region: process.env.FC_ARTIFACT_REGION ?? process.env.FC_REGION ?? '',
    credentials: {
      accessKeyId: process.env.FC_ARTIFACT_ACCESS_KEY_ID ?? process.env.FC_ACCESS_KEY_ID ?? '',
      secretAccessKey:
        process.env.FC_ARTIFACT_ACCESS_KEY_SECRET ?? process.env.FC_ACCESS_KEY_SECRET ?? ''
    },
    secure: true,
    internal: false,
    cname: false,
    enableProxy: false
  } as IStorageOptions);

  return async (targetPath: string) => {
    const { body } = await client.downloadObject({
      key: env.PLUGIN_ARTIFACT_KEY
    });
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    await fs.writeFile(targetPath, Buffer.concat(chunks));
  };
}
