import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface SingleToolEtagOptions {
  /**
   * 工具根目录（包含 src/ 目录）
   */
  rootDir: string;
}

/**
 * 计算单工具的 etag。
 *
 * 规则：
 * - 仅计算 src/ 目录下的源码文件
 * - 排除测试相关文件：
 *   - 文件名包含 .test. 或 .spec.
 *   - 位于 __tests__ 目录中的文件
 * - 参与计算的每一行格式为：
 *   <relative-path>:<file-content-md5>\n
 *   其中 relative-path 相对于 rootDir，统一使用 / 作为分隔符。
 * - 对拼接后的所有行再次计算 md5，得到最终 etag。
 */
export async function computeSingleToolEtag(options: SingleToolEtagOptions): Promise<string> {
  const srcDir = path.join(options.rootDir, 'src');

  if (!(await pathExists(srcDir))) {
    // 没有 src 目录时，视为没有源码文件，返回空内容的 md5。
    return md5('');
  }

  const files: { rel: string; abs: string }[] = [];

  const walk = async (dir: string): Promise<void> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === '__tests__') continue;
        await walk(full);
        continue;
      }

      if (!entry.isFile()) continue;

      const filename = entry.name;
      if (filename.includes('.test.') || filename.includes('.spec.')) {
        continue;
      }

      const relFromRoot = path.relative(options.rootDir, full).split(path.sep).join('/');

      // 仅纳入 src/ 下的文件
      if (!relFromRoot.startsWith('src/')) continue;

      files.push({
        rel: relFromRoot,
        abs: full
      });
    }
  };

  await walk(srcDir);

  files.sort((a, b) => a.rel.localeCompare(b.rel));

  let aggregate = '';
  for (const file of files) {
    const content = await fs.readFile(file.abs);
    const fileHash = md5(content);
    aggregate += `${file.rel}:${fileHash}\n`;
  }

  return md5(aggregate);
}

export interface ToolSuiteEtagOptions {
  /**
   * 工具集根目录（包含 children/ 子工具目录）
   */
  rootDir: string;
  /**
   * 工具集的 toolId（通常为根目录名称）
   */
  toolId: string;
  /**
   * 子工具目录名称列表（不含路径）
   */
  children: string[];
}

/**
 * 计算工具集的 etag。
 *
 * 规则：
 * - 首先为每个子工具单独计算 etag（同单工具规则）
 * - 然后按子工具名称排序，拼接行：
 *   <tool-suite-id>/<child-name>:<child-etag>\n
 * - 对拼接后的所有行再次计算 md5，得到工具集的 etag。
 */
export async function computeToolSuiteEtag(options: ToolSuiteEtagOptions): Promise<string> {
  const { rootDir, toolId } = options;

  const children = [...options.children].sort();
  const lines: string[] = [];

  for (const child of children) {
    const childRoot = path.join(rootDir, 'children', child);
    const childEtag = await computeSingleToolEtag({ rootDir: childRoot });
    lines.push(`${toolId}/${child}:${childEtag}`);
  }

  const aggregate = lines.length > 0 ? `${lines.join('\n')}\n` : '';
  return md5(aggregate);
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function md5(input: string | Buffer): string {
  const hash = createHash('md5');
  hash.update(input);
  return hash.digest('hex');
}
