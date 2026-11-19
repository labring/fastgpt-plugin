import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { extract } from 'tar-stream';
import { afterEach, describe, expect, it } from 'vitest';

import { buildWorkerBundle, compileWorker } from './bundler';

const directories: string[] = [];
const source = `
import { defineToolSet, createToolHandler, defineInputSchema, defineOutputSchema, defineSecretSchema } from '@fastgpt-plugin/sdk-factory';
import z from 'zod';
export default defineToolSet({
  manifest: {},
  secretSchema: defineSecretSchema({ prefix: { type: z.string(), title: { en: 'Prefix', 'zh-CN': '前缀' }, isSecret: true } }),
  children: [{ id: 'hello', name: {}, description: {}, handler: createToolHandler({
    inputSchema: defineInputSchema({ name: { type: z.string(), title: { en: 'Name', 'zh-CN': '名称' } } }),
    outputSchema: defineOutputSchema({ text: { type: z.string(), title: { en: 'Text', 'zh-CN': '文本' } } }),
    handler: async (input, ctx) => {
      ctx.streamResponse({ type: 'answer', content: input.name });
      return { text: ctx.secrets.prefix + input.name };
    }
  }) }]
});`;

async function fixture(code = source) {
  const directory = await mkdtemp(join(tmpdir(), 'fastgpt-worker-build-test-'));
  directories.push(directory);
  const entry = `${directory}/index.ts`;
  await writeFile(entry, code);
  return {
    entry, tenantId: 'system', workerId: 'hello', versionId: 'v1',
    compatibilityDate: '2026-01-01', invokeGatewayUrl: 'https://host.invalid/invoke'
  };
}

async function unpack(bundle: Buffer) {
  const archive = extract();
  const files = new Map<string, Buffer>();
  const collected = (async () => {
    for await (const entry of archive) {
      const chunks: Buffer[] = [];
      for await (const chunk of entry) {
        if (!(chunk instanceof Uint8Array)) throw new Error('Expected archive bytes');
        chunks.push(Buffer.from(chunk));
      }
      files.set(entry.header.name, Buffer.concat(chunks));
    }
  })();
  archive.end(bundle);
  await collected;
  return files;
}

// Execute in a fresh JS context with Web APIs only; process, Buffer, IPC and Node
// builtins are deliberately unavailable. This does not claim workerd equivalence.
async function execute(code: string, stream: boolean) {
  const program = `
    import vm from 'node:vm';
    const context = vm.createContext({ Request, Response, ReadableStream, TextEncoder, Headers, URL, AbortSignal, AbortController });
    const module = new vm.SourceTextModule(${JSON.stringify(code)}, { context });
    await module.link(() => { throw new Error('Unexpected external module'); });
    await module.evaluate();
    const response = await module.namespace.default.fetch(new Request('https://worker/system/hello/run', {
      method: 'POST', headers: { Accept: ${JSON.stringify(stream ? 'application/x-ndjson' : 'application/json')} },
      body: JSON.stringify({ payload: { input: { name: 'Alice' }, secrets: { prefix: 'Hi ' }, childId: 'hello', systemVar: {} } })
    }));
    if (response.status !== 200) throw new Error('Worker response status ' + response.status);
    console.log(await response.text());
  `;
  const { stdout } = await promisify(execFile)(process.execPath,
    ['--experimental-vm-modules', '--input-type=module', '-e', program], { maxBuffer: 8 * 1024 * 1024 });
  return stdout.trim();
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('buildWorkerBundle', () => {
  it('builds an unchanged SDK plugin into a self-contained Worker with no Node globals', async () => {
    const result = await buildWorkerBundle(await fixture());
    expect(JSON.parse(await execute(result.code, false))).toEqual({ text: 'Hi Alice' });
    expect((await execute(result.code, true)).split('\n').map((line) => JSON.parse(line))).toEqual([
      { event: 'chunk', data: { type: 'stream', data: { type: 'answer', content: 'Alice' } } },
      { event: 'chunk', data: { type: 'response', data: { text: 'Hi Alice' } } },
      { event: 'end' }
    ]);
  }, 20000);

  it('packages deterministic coworkerd v2 tar with verified module and package hashes', async () => {
    const options = { ...await fixture(), activate: true };
    const result = await buildWorkerBundle(options);
    const files = await unpack(result.bundle);
    expect([...files.keys()]).toEqual(['manifest.json', 'hello/v1/package.json', 'hello/v1/worker.mjs']);
    const packageBytes = files.get('hello/v1/package.json')!;
    const pkg = JSON.parse(packageBytes.toString());
    const bytes = files.get('hello/v1/worker.mjs')!;
    expect(pkg.modules).toEqual([{
      bytes: bytes.length, name: 'worker.mjs',
      sha256: createHash('sha256').update(bytes).digest('hex'), type: 'esm'
    }]);
    expect(result.contentHash).toBe(createHash('sha256').update(packageBytes).digest('hex'));
    const manifest = JSON.parse(files.get('manifest.json')!.toString());
    expect(manifest.routes).toEqual([{ host: '*', pathPrefix: '/system/hello', workerId: 'hello' }]);
    expect(manifest.workers[0].versions[0]).toMatchObject({
      versionId: 'v1', format: 'v2', mainModule: 'worker.mjs', contentHash: result.contentHash,
      compatibilityDate: options.compatibilityDate, compatibilityFlags: []
    });
  }, 20000);

  it('does not add routes to a non-activating upload', async () => {
    const result = await buildWorkerBundle(await fixture());
    const files = await unpack(result.bundle);
    expect(JSON.parse(files.get('manifest.json')!.toString()).routes).toEqual([]);
  }, 20000);

  it.each(['node:fs', 'child_process', 'node:net'])('rejects unsupported builtin %s with actionable diagnostics', async (builtin) => {
    const options = await fixture(`import * as api from '${builtin}'; export default api;`);
    await expect(buildWorkerBundle(options)).rejects.toThrow(/Worker build does not support/);
  });

  it('rejects unsupported builtins in transitive dependencies', async () => {
    const options = await fixture(`import api from './dependency'; export default api;`);
    await writeFile(options.entry.replace('index.ts', 'dependency.ts'), `import fs from 'node:fs'; export default fs;`);
    await expect(buildWorkerBundle(options)).rejects.toThrow(/node:fs/);
  });

  it('rejects host file and package imports from uploaded bundles before resolving them', async () => {
    for (const dependency of ['/etc/passwd', 'file:///etc/passwd', './dependency.js', 'date-fns']) {
      const options = await fixture(`import value from ${JSON.stringify(dependency)}; export default value;`);
      await expect(compileWorker({ ...options, bundledInput: true })).rejects.toThrow('Uploaded plugin must bundle its dependencies');
    }
  });

  it('validates package identifiers and compatibility date before building', async () => {
    const options = await fixture();
    await expect(buildWorkerBundle({ ...options, workerId: '../escape' })).rejects.toThrow('Invalid workerId');
    await expect(buildWorkerBundle({ ...options, compatibilityDate: '2026-02-30' })).rejects.toThrow('Invalid compatibilityDate');
    await expect(buildWorkerBundle({ ...options, invokeGatewayUrl: 'file:///tmp/gateway' })).rejects.toThrow('HTTP(S)');
  });

  it('polyfills Buffer and node:buffer for Web-only worker execution', async () => {
    const pluginWithBuffer = `
import { defineToolSet, createToolHandler, defineInputSchema, defineOutputSchema } from '@fastgpt-plugin/sdk-factory';
import { Buffer as NodeBuffer } from 'node:buffer';
import z from 'zod';
export default defineToolSet({
  manifest: {},
  children: [{
    id: 'hello',
    name: {},
    description: {},
    handler: createToolHandler({
      inputSchema: defineInputSchema({ name: { type: z.string(), title: { en: 'Name', 'zh-CN': '名称' } } }),
      outputSchema: defineOutputSchema({ base64: { type: z.string(), title: { en: 'Base64', 'zh-CN': 'Base64' } } }),
      handler: async (input) => {
        const encoded = NodeBuffer.from(input.name).toString('base64');
        const decoded = Buffer.from(encoded, 'base64').toString('utf8');
        return { base64: encoded + ':' + decoded };
      }
    })
  }]
});`;
    const options = await fixture(pluginWithBuffer);
    const result = await buildWorkerBundle(options);
    const output = await execute(result.code, false);
    expect(JSON.parse(output)).toEqual({ base64: 'QWxpY2U=:Alice' });
  }, 20000);

  it('allows node:buffer and buffer in bundledInput mode', async () => {
    const options = await fixture(`import { Buffer } from 'node:buffer'; export default { buffer: Buffer.isBuffer };`);
    const code = await compileWorker({ ...options, bundledInput: true });
    expect(code).toBeDefined();
  });
});
