import fs from 'fs';
import path from 'path';

export interface CopyIconOptions {
  sourceDir: string;
  targetDir: string;
  items?: string[];
  logPrefix?: string;
}

/**
 * Copy logo files from source directory to target directory.
 * @param options CopyIconOptions
 * @returns Count of copied icons
 */
export async function copyToolIcons(options: CopyIconOptions): Promise<number> {
  const { sourceDir, targetDir, items, logPrefix = 'Copied icon' } = options;

  const itemList = items || fs.readdirSync(sourceDir);

  // create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let copiedCount = 0;

  for (const item of itemList) {
    const itemDir = path.join(sourceDir, item);

    // check if the item directory exists and is a directory
    if (!fs.existsSync(itemDir) || !fs.statSync(itemDir).isDirectory()) {
      continue;
    }

    const logoPath = path.join(itemDir, 'logo.svg');
    if (fs.existsSync(logoPath)) {
      const logoTarget = path.join(targetDir, `${item}.svg`);
      fs.cpSync(logoPath, logoTarget);
      console.log(`📦 ${logPrefix}: ${path.relative(process.cwd(), logoTarget)}`);
      copiedCount++;
    }
  }

  return copiedCount;
}
