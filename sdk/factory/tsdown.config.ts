import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    deps: {
      neverBundle: ['zod', 'tsdown', 'tar-stream'],
      alwaysBundle: ['undici'],
      onlyBundle: false
    },
    entry: ['./src/index.ts', './src/worker.ts', './src/runtime-shim.ts', './src/bundler.ts'],
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
  },
  {
    deps: {
      alwaysBundle: ['buffer', 'buffer/'],
      onlyBundle: false
    },
    entry: ['./src/buffer-polyfill.ts'],
    platform: 'neutral',
    target: 'es2022',
    format: 'esm',
    outDir: './dist',
    tsconfig: './tsconfig.json',
    dts: false,
    clean: false,
    minify: true,
    outputOptions: {
      codeSplitting: false
    },
    outExtensions() {
      return {
        js: '.js'
      };
    }
  }
]);
