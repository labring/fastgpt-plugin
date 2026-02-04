import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/**/*.ts'],
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
