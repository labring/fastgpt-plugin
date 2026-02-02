import fs from 'fs';
import path from 'path';

export interface CopyIconOptions {
  sourceDir: string;
  targetDir: string;
  items?: string[];
  logPrefix?: string;
}

// Supported image formats for logo files
export const iconFormats = ['svg', 'png', 'jpeg', 'webp', 'jpg'];

/**
 * Find logo file with supported formats in the given directory
 * @param directory Directory to search in
 * @returns Logo file path if found, null otherwise
 */
function findLogoFile(directory: string): string | null {
  for (const format of iconFormats) {
    const logoPath = path.join(directory, `logo.${format}`);
    if (fs.existsSync(logoPath)) {
      return logoPath;
    }
  }
  return null;
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

    // Find logo file with any supported format
    const logoPath = findLogoFile(itemDir);
    if (logoPath) {
      const logoExtension = path.extname(logoPath);
      const logoTarget = path.join(targetDir, `${item}${logoExtension}`);
      fs.cpSync(logoPath, logoTarget);
      console.log(`📦 ${logPrefix}: ${path.relative(process.cwd(), logoTarget)}`);
      copiedCount++;
    }

    // Handle children directory
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

        // Find child logo file with any supported format
        const childLogoPath = findLogoFile(childDir);
        if (childLogoPath) {
          const childLogoExtension = path.extname(childLogoPath);
          const childLogoTarget = path.join(childrenTargetDir, `${child}${childLogoExtension}`);
          fs.cpSync(childLogoPath, childLogoTarget);
          console.log(`📦 ${logPrefix}: ${path.relative(process.cwd(), childLogoTarget)}`);
          copiedCount++;
        }
      }
    }
  }

  return copiedCount;
}
