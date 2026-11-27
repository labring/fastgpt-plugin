import { access } from 'node:fs/promises';
import { Readable } from 'node:stream';

import { describe, expect, it, vi } from 'vitest';

import { FileObject } from '@domain/value-objects/file/file-object.vo';
import { successResult } from '@domain/value-objects/result.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

import { createWorkerArtifactBuilder, readWorkerArtifact } from './worker-artifact';

const gateway = 'https://gateway.invalid/invoke';
const index = new FileObject({
  metaData: { fileKey: 'index', fileName: 'index.js', contentType: 'application/javascript', size: 1, etag: 'e', createTime: new Date() },
  getBuffer: async () => successResult(Buffer.from('export default {}')),
  getReadStream: async () => successResult(Readable.from([]))
});

describe('Worker artifact construction', () => {
  it('records code integrity and gateway provenance and removes the temporary entry', async () => {
    const compile = vi.fn(async (_options: { entry: string }) => 'compiled-code');
    const [artifact, error] = await createWorkerArtifactBuilder({ invokeGatewayUrl: gateway, compile }).build(index);
    expect(error).toBeNull();
    expect(readWorkerArtifact(artifact!, gateway).code).toBe('compiled-code');
    await expect(access(compile.mock.calls[0][0].entry)).rejects.toThrow();
    expect(() => readWorkerArtifact(artifact!, 'https://other.invalid')).toThrow('configuration changed');
    const corrupted = JSON.parse(artifact!.toString());
    corrupted.code = 'tampered';
    expect(() => readWorkerArtifact(Buffer.from(JSON.stringify(corrupted)), gateway)).toThrow('integrity');
  });

  it('reports compilation failures and cleans the temporary input', async () => {
    const compile = vi.fn(async (_options: { entry: string }) => { throw new Error('node:fs unsupported'); });
    const [artifact, error] = await createWorkerArtifactBuilder({ invokeGatewayUrl: gateway, compile }).build(index);
    expect(artifact).toBeNull();
    expect(error?.code).toBe(ErrorCode.pluginRuntimeArtifactBuildFailed);
    expect(error?.reason.en).toContain('node:fs');
    await expect(access(compile.mock.calls[0][0].entry)).rejects.toThrow();
  });
});
