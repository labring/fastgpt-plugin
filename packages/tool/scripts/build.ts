import { $ } from 'bun';
import fs from 'fs';
import path from 'path';

const outDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}
const toolsDir = path.join(__dirname, '..', 'packages');
const ignoreList = ['.gitignore'];
const tools = fs.readdirSync(toolsDir).filter((f) => !ignoreList.includes(f));
if (tools.length === 0) {
  console.log('No tools found');
  process.exit(0);
}

const runtimeDir = path.join(__dirname, '..', '..', 'runtime');

await Promise.all(tools.map((tool) => $`bun --cwd=packages/${tool} run build`.quiet()));

async function move(tool: string) {
  const src = path.join(toolsDir, tool, 'dist', 'index.js');
  const dst = path.join(runtimeDir, 'dist', 'tools');
  if (!fs.existsSync(dst)) {
    fs.mkdirSync(dst);
  }
  fs.cpSync(src, path.join(dst, `${tool}.js`));
}

await Promise.all(tools.map((tool) => move(tool)));

console.log(`Tools Build complete, outDir: ${outDir}, total files: ${tools.length}`);
