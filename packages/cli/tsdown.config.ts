import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  minify: false,
  unbundle: false,
  inlineOnly: false,
  fixedExtension: false,
  failOnWarn: false
});
