import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/**/*.ts'],
  format: 'esm',
  clean: true,
  minify: true,
  dts: {
    enabled: true,
    sourcemap: false
  },
  outExtensions: () => ({ dts: '.d.ts', js: '.js' })
});
