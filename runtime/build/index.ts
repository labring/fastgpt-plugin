import { $ } from 'bun';
import { cp } from 'node:fs/promises';
import { join } from 'node:path';
// 1. build worker
await $`bun run build:worker`;
// 2. copy templates
await cp(
  join(__dirname, '..', '..', 'modules', 'workflow', 'templates'),
  join(__dirname, '..', '..', 'dist', 'workflows'),
  {
    recursive: true
  }
);

await $`bun run build:main`;
