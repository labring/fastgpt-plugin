import { basePath } from '@tool/constants';
import { LoadToolsDev } from '@tool/loadToolDev';
import { writeFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';

const filterToolList = ['.DS_Store', '.git', '.github', 'node_modules', 'dist', 'scripts'];

console.log(
  'Building JSON data source for marketplace, please make sure you have the complete repo'
);

const dir = join(basePath, 'modules', 'tool', 'packages');
const dirs = (await readdir(dir)).filter((filename) => !filterToolList.includes(filename));
const devTools = (
  await Promise.all(
    dirs.map(async (filename) => {
      return LoadToolsDev(filename);
    })
  )
).flat();
const toolMap = new Map();
for (const tool of devTools) {
  toolMap.set(tool.toolId, tool);
}

const toolList = Array.from(toolMap.values());
writeFileSync(join(basePath, 'dist', 'tools.json'), JSON.stringify(toolList));

console.log(
  'JSON data source for marketplace has been built successfully',
  'tools:',
  toolList.length
);

console.log(join(basePath, 'dist', 'tools.json'));
