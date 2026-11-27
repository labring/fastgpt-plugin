import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import z from 'zod';

import type { PluginArtifactBuilderPort } from '@domain/ports/plugin/plugin-artifact-builder.port';
import { createError } from '@domain/value-objects/error.vo';
import { failureResult, successResult } from '@domain/value-objects/result.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

export const WORKER_ARTIFACT_FORMAT = 'fastgpt-worker-v2';

const MAX_MODULE_BYTES = 10 * 1024 * 1024;
const ArtifactSchema = z.object({
  format: z.literal(WORKER_ARTIFACT_FORMAT),
  invokeGatewayUrl: z.string().url(),
  code: z.string(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/)
}).strict();

const digest = (code: string) => createHash('sha256').update(code).digest('hex');

export function isCurrentWorkerArtifact(bytes: Buffer): boolean {
  try {
    const parsed = JSON.parse(bytes.toString('utf8')) as { format?: unknown };
    return parsed?.format === WORKER_ARTIFACT_FORMAT;
  } catch {
    return false;
  }
}

/** A single storage object keeps code and integrity metadata atomic. No deployment identity or secrets. */
export function readWorkerArtifact(bytes: Buffer, invokeGatewayUrl: string) {
  const artifact = ArtifactSchema.parse(JSON.parse(bytes.toString('utf8')));
  if (artifact.invokeGatewayUrl !== invokeGatewayUrl) {
    throw new Error('Worker gateway configuration changed; upload the plugin again');
  }
  if (Buffer.byteLength(artifact.code) > MAX_MODULE_BYTES || digest(artifact.code) !== artifact.sha256) {
    throw new Error('Worker artifact integrity check failed');
  }
  return artifact;
}

export function createWorkerArtifactBuilder(options: {
  invokeGatewayUrl: string;
  compile: (options: { entry: string; invokeGatewayUrl: string; bundledInput: true }) => Promise<string>;
}): PluginArtifactBuilderPort {
  return {
    async build(index) {
      let directory: string | undefined;
      try {
        const [bytes, error] = await index.fileBuffer;
        if (error) return failureResult(error);
        directory = await mkdtemp(join(tmpdir(), 'fastgpt-upload-worker-'));
        const entry = join(directory, 'index.mjs');
        await writeFile(entry, bytes);
        const code = await options.compile({ entry, invokeGatewayUrl: options.invokeGatewayUrl, bundledInput: true });
        if (Buffer.byteLength(code) > MAX_MODULE_BYTES) throw new Error('Worker code exceeds coworkerd 10 MiB module limit');
        return successResult(Buffer.from(JSON.stringify({
          format: WORKER_ARTIFACT_FORMAT, invokeGatewayUrl: options.invokeGatewayUrl,
          code, sha256: digest(code)
        })));
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'Unknown build error';
        return failureResult(
          createError(ErrorCode.pluginRuntimeArtifactBuildFailed, {
            message: `Worker build failed: ${detail}`,
            reason: {
              en: `Worker build failed: ${detail}`,
              'zh-CN': `Worker 构建失败：${detail}`
            },
            cause: error
          })
        );
      } finally {
        if (directory) await rm(directory, { recursive: true, force: true });
      }
    }
  };
}
