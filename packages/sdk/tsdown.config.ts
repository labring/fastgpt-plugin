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
  outExtensions() {
    return {
      dts: '.d.ts',
      js: '.js'
    };
  }
});
