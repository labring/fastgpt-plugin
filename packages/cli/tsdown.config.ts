import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  minify: true,
  unbundle: false,
  inlineOnly: false,
  fixedExtension: false,
  failOnWarn: false
});
