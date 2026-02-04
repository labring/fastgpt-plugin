import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['main.ts'],
  format: 'esm',
  clean: true,
  dts: {
    enabled: true,
    sourcemap: false
  },
  outExtensions() {
    return {
      dts: '.d.ts',
      js: '.js'
    };
  }
});
