import { defineConfig } from 'tsdown';

export default defineConfig({
  external: ['zod'],
  entry: './src/index.ts',
  format: 'esm',
  outDir: './dist',
  tsconfig: './tsconfig.json',
  dts: {
    enabled: true,
    sourcemap: false,
    eager: true
  },
  clean: true,
  minify: true,
  outExtensions() {
    return {
      dts: '.d.ts',
      js: '.js'
    };
  }
});
