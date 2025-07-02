import fs from 'fs';
import path from 'path';

export interface CopyIconOptions {
  toolsDir: string;
  targetDir: string;
  tools?: string[];
  logPrefix?: string;
}

/**
 * Copy tool icons from the tools directory to the target directory.
 * @param options CopyIconOptions
 * @returns Count of copied icons
 */
export async function copyToolIcons(options: CopyIconOptions): Promise<number> {
  const { toolsDir, targetDir, tools, logPrefix = 'Copied icon' } = options;

  // will read tools from the toolsDir if not provided
  const toolList = tools || fs.readdirSync(toolsDir);

  // create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let copiedCount = 0;

  for (const tool of toolList) {
    const toolDir = path.join(toolsDir, tool);

    // check if the tool directory exists and is a directory
    if (!fs.existsSync(toolDir) || !fs.statSync(toolDir).isDirectory()) {
      continue;
    }

    const iconPath = path.join(toolDir, `logo.svg`);
    if (fs.existsSync(iconPath)) {
      const iconTarget = path.join(targetDir, `${tool}.svg`);
      fs.cpSync(iconPath, iconTarget);
      console.log(`📦 ${logPrefix}: /imgs/tools/${tool}.svg`);
      copiedCount++;
    }
  }

  return copiedCount;
}
