import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['client.ts'],
  format: 'esm',
  clean: true,
  dts: {
    enabled: true,
    sourcemap: false,
    eager: true
  },
  // 将 helpers 包打包进来，不作为外部依赖
  noExternal: [/^@fastgpt-plugin\/helpers/],
  // 将 @fastgpt-sdk/invoke 标记为外部依赖
  external: ['@fastgpt-sdk/invoke'],
  outExtensions() {
    return {
      dts: '.d.ts',
      js: '.js'
    };
  }
});
