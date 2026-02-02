import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['client.ts'],
  format: 'esm',
  clean: true,
  dts: {
    enabled: true,
    sourcemap: false
  },
  external: ['zod'],
  outExtensions() {
    return {
      dts: '.d.ts',
      js: '.js'
    };
  }
});
