import { $ } from 'bun';
await $`bun --cwd=tools run build`;
await $`bun --cwd=runtime run build`;
console.log('Build complete');
