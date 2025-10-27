import dts from 'bun-plugin-dts';

const result = await Bun.build({
  entrypoints: ['./client.ts'],
  target: 'node',
  external: ['zod'],
  outdir: './dist',
  plugins: [dts()]
});

export {};

console.log('Build sdk completed successfully');
console.log(result);
