import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    main: 'main.ts'
  },
  format: 'esm',
  clean: true,
  dts: {
    enabled: false
  },
  outExtensions() {
    return {
      js: '.js'
    };
  }
});
