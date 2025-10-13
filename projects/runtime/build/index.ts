// TODO build the runtime service
// "build:worker": "bun build --env=disable --outfile=dist/worker.js --target=node --minify ../../lib/worker/worker.ts",
// "build:main": "bun build --env=disable --outfile=dist/index.js --target=node --minify index.ts",
// "build": "tsc && bun run build:worker && bun run build:main",
// "build:no-tsc": "bun run build:worker && bun run build:main",

import { $ } from 'bun';
import { cp } from 'node:fs/promises';
import { join } from 'node:path';
// 1. build worker
await $`bun run build:worker`;
// 2. move templates
await cp(
  join(__dirname, '..', '..', 'modules', 'workflow', 'templates'),
  join(__dirname, '..', 'dist', 'workflows')
);
await $`bun run build:main`;
