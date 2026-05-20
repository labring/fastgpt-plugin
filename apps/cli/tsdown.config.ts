import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  minify: false,
  unbundle: false,
  deps: {
    neverBundle: ['@fastgpt-plugin/sdk-factory', '@fastgpt-plugin/sdk-factory/*'],
    onlyBundle: false
  },
  fixedExtension: false,
  failOnWarn: false
});
