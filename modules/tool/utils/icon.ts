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
export async function copyIcons(options: CopyIconOptions): Promise<number> {
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

    const childrenDir = path.join(itemDir, 'children');
    if (fs.existsSync(childrenDir) && fs.statSync(childrenDir).isDirectory()) {
      const childrenTargetDir = path.join(targetDir, item);
      if (!fs.existsSync(childrenTargetDir)) {
        fs.mkdirSync(childrenTargetDir, { recursive: true });
      }

      const children = fs.readdirSync(childrenDir);
      for (const child of children) {
        const childDir = path.join(childrenDir, child);
        if (!fs.existsSync(childDir) || !fs.statSync(childDir).isDirectory()) {
          continue;
        }

        const childLogoPath = path.join(childDir, 'logo.svg');
        if (fs.existsSync(childLogoPath)) {
          const childLogoTarget = path.join(childrenTargetDir, `${child}.svg`);
          fs.cpSync(childLogoPath, childLogoTarget);
          console.log(`📦 ${logPrefix}: ${path.relative(process.cwd(), childLogoTarget)}`);
          copiedCount++;
        }
      }
    }
  }

  return copiedCount;
}
