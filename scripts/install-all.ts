import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

const rootDir = process.argv[2] || './modules/tool/packages';
// 从命令行参数获取并发数，默认为 5
const concurrency = parseInt(process.argv[3] || '5', 10);

interface InstallTask {
  subDir: string;
  name: string;
}

async function installInSubdir(subDir: string, name: string): Promise<boolean> {
  console.log(`📦 Installing in: ${subDir}`);

  return new Promise((resolve) => {
    const child = spawn('bun', ['install'], {
      cwd: subDir,
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✓ Success: ${name}\n`);
        resolve(true);
      } else {
        console.log(`✗ Failed: ${name}\n`);
        resolve(false);
      }
    });

    child.on('error', (err) => {
      console.error(`✗ Error in ${name}:`, err.message);
      resolve(false);
    });
  });
}

async function installWithConcurrency(tasks: InstallTask[], concurrency: number) {
  const results: boolean[] = [];
  const executing: Promise<void>[] = [];

  console.log(`🚀 Starting installation with concurrency: ${concurrency}\n`);

  for (const task of tasks) {
    const promise = installInSubdir(task.subDir, task.name).then((result) => {
      results.push(result);
      executing.splice(executing.indexOf(promise), 1);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);

  return results;
}

async function installInSubdirs(dir: string) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const tasks: InstallTask[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'node_modules') continue;

    const subDir = join(dir, entry.name);
    const packageJson = join(subDir, 'package.json');

    if (existsSync(packageJson)) {
      tasks.push({ subDir, name: entry.name });
    }
  }

  console.log(`Found ${tasks.length} packages to install\n`);

  const startTime = Date.now();
  const results = await installWithConcurrency(tasks, concurrency);
  const endTime = Date.now();

  const successCount = results.filter((r) => r).length;
  const failCount = results.filter((r) => !r).length;

  console.log('\n📊 Installation Summary:');
  console.log(`   Total: ${tasks.length}`);
  console.log(`   ✓ Success: ${successCount}`);
  console.log(`   ✗ Failed: ${failCount}`);
  console.log(`   ⏱️  Time: ${((endTime - startTime) / 1000).toFixed(2)}s`);
}

if (import.meta.main) {
  installInSubdirs(rootDir);
}
