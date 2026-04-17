import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: './src/index.ts',
  format: 'esm',
  outDir: './dist',
  tsconfig: './tsconfig.json',
  dts: {
    enabled: true,
    sourcemap: true,
    eager: true
  },
  clean: true,
  outExtensions() {
    return {
      dts: '.d.ts',
      js: '.js'
    };
  },
  minify: true,
  external: ['zod'],
  sourcemap: true
});
