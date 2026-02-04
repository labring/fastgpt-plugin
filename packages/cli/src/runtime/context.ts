import { mkdir, readFile, readdir, writeFile } from 'fs/promises';
import path from 'path';
import type { APICapabilitiesContext } from '@fastgpt-plugin/cli/interfaces/context';

/**
 * 默认的运行时能力实现，封装 Node 的 path 与 fs/promises。
 * 所有命令共享这一实现，便于在测试中注入 mock。
 */
export function createDefaultAPICapabilitiesContext(): APICapabilitiesContext {
  return {
    path: {
      join: path.join,
      resolve: path.resolve,
      dirname: path.dirname,
      relative: path.relative,
      basename: path.basename
    },

    fs: {
      mkdir: async (p: string, opts?: { recursive?: boolean }) => {
        await mkdir(p, opts);
        return;
      },
      readFile: async (p: string, encoding?: BufferEncoding) => {
        const b = await readFile(p, encoding ?? 'utf-8');
        return typeof b === 'string' ? b : (b as Buffer).toString('utf-8');
      },
      writeFile: async (p: string, data: string, encoding?: BufferEncoding) => {
        await writeFile(p, data, encoding ?? 'utf-8');
        return;
      },
      readdir: async (p: string, options: { withFileTypes: true }) => {
        const entries = await readdir(p, options);
        return entries.map((e) => ({
          name: e.name,
          isDirectory: () => e.isDirectory()
        }));
      }
    }
  };
}
