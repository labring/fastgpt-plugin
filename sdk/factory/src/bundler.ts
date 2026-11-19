import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { isBuiltin } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { pack } from 'tar-stream';
import { build } from 'tsdown';

import { generateWorkerEntry } from './runtime-shim';

export type WorkerCompileOptions = {
  /** TypeScript source or CLI-built JavaScript with an external SDK import. */
  entry: string;
  invokeGatewayUrl: string;
  /** Uploaded bundles may import only the SDK; never resolve arbitrary host files/packages. */
  bundledInput?: boolean;
};

export type WorkerPackageOptions = {
  code: string;
  tenantId: string;
  workerId: string;
  versionId: string;
  compatibilityDate: string;
  /** Must agree with uploadVersion's activate option; non-activating uploads have no routes. */
  activate?: boolean;
};

export type WorkerBuildOptions = WorkerCompileOptions & Omit<WorkerPackageOptions, 'code'>;

export type WorkerBuildResult = {
  code: string;
  /** Coworkerd v2 archive, ready for uploadVersion({ bundle }). Not a FastGPT marketplace ZIP. */
  bundle: Buffer;
  contentHash: string;
};

/**
 * Conservative portable profile: bundle every dependency, reject Node builtins,
 * and never polyfill an unavailable API with a silent stub. This is a build
 * check, not proof that dynamically selected APIs will work at execution time.
 */
const require = createRequire(import.meta.url);

export async function buildWorkerBundle(options: WorkerBuildOptions): Promise<WorkerBuildResult> {
  for (const [label, value] of Object.entries({
    tenantId: options.tenantId, workerId: options.workerId, versionId: options.versionId
  })) {
    if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(value)) {
      throw new Error(`Invalid ${label}: expected 1-63 lowercase letters, digits or hyphens`);
    }
  }
  const date = new Date(`${options.compatibilityDate}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.compatibilityDate) ||
      !Number.isFinite(date.valueOf()) || date.toISOString().slice(0, 10) !== options.compatibilityDate) {
    throw new Error('Invalid compatibilityDate: expected a real YYYY-MM-DD date');
  }
  return packageWorkerBundle({ ...options, code: await compileWorker(options) });
}

export async function compileWorker(options: WorkerCompileOptions): Promise<string> {
  const gateway = new URL(options.invokeGatewayUrl);
  if (!['http:', 'https:'].includes(gateway.protocol) || gateway.username || gateway.password) {
    throw new Error('invokeGatewayUrl must be an HTTP(S) URL without credentials');
  }

  const directory = await mkdtemp(join(tmpdir(), 'fastgpt-worker-'));
  try {
    const pluginEntry = await realpath(resolve(options.entry));
    const entryFile = join(directory, 'worker-entry.mjs');
    await writeFile(
      entryFile,
      generateWorkerEntry(pluginEntry, { invokeGatewayUrl: options.invokeGatewayUrl })
    );
    const localModule = (name: string) => {
      const ts = fileURLToPath(new URL(`./${name}.ts`, import.meta.url));
      return existsSync(ts) ? ts : fileURLToPath(new URL(`./${name}.js`, import.meta.url));
    };
    await build({
      config: false,
      entry: { worker: entryFile },
      outDir: directory,
      platform: 'neutral',
      target: 'es2022',
      // Do not embed temporary source paths; repeated uploads must produce identical code.
      minify: true,
      format: 'esm',
      dts: false,
      clean: false,
      deps: { onlyBundle: /.*/ },
      outExtensions: () => ({ js: '.mjs' }),
      outputOptions: { codeSplitting: false },
      plugins: [{
        name: 'fastgpt-worker-profile',
        resolveId: {
          order: 'pre',
          handler(id, importer) {
            if (id === 'node:buffer' || id === 'buffer') {
              return require.resolve('buffer/');
            }
            if (isBuiltin(id) || id.endsWith('.node')) {
              throw new Error(`Worker build does not support ${id} (imported by ${importer ?? 'entry'}). Use Web APIs or select the Node runtime.`);
            }
            if (options.bundledInput && importer === pluginEntry && id !== '@fastgpt-plugin/sdk-factory' && id !== 'node:buffer' && id !== 'buffer') {
              throw new Error(`Uploaded plugin must bundle its dependencies; unsupported import: ${id}`);
            }
            // tsdown treats peer dependencies as external by default. The Worker build must inline
            // the SDK's runtime schemas rather than emit an unresolved `import "zod"` in its bundle.
            if (id === 'zod') return require.resolve('zod');
            if (id === '@fastgpt-plugin/sdk-factory') return localModule('worker');
            if (id === '@fastgpt-plugin/sdk-factory/runtime-shim') return localModule('runtime-shim');
            if (id.startsWith('@fastgpt-plugin/sdk-factory/')) {
              throw new Error(`Unsupported SDK subpath in Worker build: ${id}`);
            }
          }
        },
        generateBundle(_output, bundle) {
          for (const item of Object.values(bundle)) {
            if (item.type === 'chunk' && (item.imports.length || item.dynamicImports.length)) {
              throw new Error(
                `Worker bundle must not contain unresolved imports in ${item.fileName}: ` +
                  JSON.stringify({ imports: item.imports, dynamicImports: item.dynamicImports })
              );
            }
          }
        }
      }]
    });
    const code = await readFile(join(directory, 'worker.mjs'), 'utf8');
    return code;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

/** Wrap an already compiled module in deployment-specific coworkerd metadata. */
export async function packageWorkerBundle(options: WorkerPackageOptions): Promise<WorkerBuildResult> {
  for (const [label, value] of Object.entries({
    tenantId: options.tenantId, workerId: options.workerId, versionId: options.versionId
  })) {
    if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(value)) {
      throw new Error(`Invalid ${label}: expected 1-63 lowercase letters, digits or hyphens`);
    }
  }
  const date = new Date(`${options.compatibilityDate}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.compatibilityDate) ||
      !Number.isFinite(date.valueOf()) || date.toISOString().slice(0, 10) !== options.compatibilityDate) {
    throw new Error('Invalid compatibilityDate: expected a real YYYY-MM-DD date');
  }
  const moduleBytes = Buffer.from(options.code);
  if (moduleBytes.length > 10 * 1024 * 1024) throw new Error('Worker code exceeds coworkerd 10 MiB module limit');
  const packageJson = canonical({ modules: [{
    bytes: moduleBytes.length, name: 'worker.mjs', sha256: hash(moduleBytes), type: 'esm'
  }] });
  const contentHash = hash(packageJson);
  const version = {
    versionId: options.versionId, format: 'v2',
    compatibilityDate: options.compatibilityDate, compatibilityFlags: [],
    mainModule: 'worker.mjs', contentHash, variables: [], bindings: []
  };
  const manifest = {
    workers: [{ workerId: options.workerId, activeVersion: options.versionId, versions: [version] }],
    routes: options.activate ? [{
      host: '*', pathPrefix: `/${options.tenantId}/${options.workerId}`, workerId: options.workerId
    }] : []
  };
  const prefix = `${options.workerId}/${options.versionId}`;
  const archive = pack();
  const collected = (async () => {
    const chunks: Buffer[] = [];
    for await (const chunk of archive) {
      if (!(chunk instanceof Uint8Array)) throw new Error('Unexpected non-byte archive chunk');
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  })();
  for (const [name, bytes] of [
    ['manifest.json', Buffer.from(canonical(manifest))],
    [`${prefix}/package.json`, Buffer.from(packageJson)],
    [`${prefix}/worker.mjs`, moduleBytes]
  ] as const) {
    archive.entry({ name, size: bytes.length, mode: 0o644, mtime: new Date(0) }, bytes);
  }
  archive.finalize();
  return { code: options.code, bundle: await collected, contentHash };
}

function hash(bytes: string | Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
