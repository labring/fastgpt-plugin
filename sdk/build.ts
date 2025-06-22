import dts from 'bun-plugin-dts';

await Bun.build({
  entrypoints: ['./client.ts'],
  target: 'node',
  external: ['zod'],
  outdir: './dist',
  plugins: [dts()]
});

export {};
