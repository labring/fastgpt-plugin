import { execFileSync } from 'node:child_process';
import { accessSync, constants, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function getGitCommonDir() {
  try {
    return execFileSync('git', ['rev-parse', '--git-common-dir'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return undefined;
  }
}

function canWrite(path) {
  try {
    accessSync(path, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

const gitCommonDir = getGitCommonDir();

if (!gitCommonDir) {
  process.exit(0);
}

const gitConfig = resolve(gitCommonDir, 'config');
const writableTarget = existsSync(gitConfig) ? gitConfig : gitCommonDir;

if (!canWrite(writableTarget)) {
  console.warn('husky install skipped: git config is not writable');
  process.exit(0);
}

execFileSync('husky', ['install'], { stdio: 'inherit' });
