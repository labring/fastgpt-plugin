import { resolve } from 'node:path';

import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@fastgpt-plugin/cli': resolve(__dirname, './src'),
      '@fastgpt-plugin/sdk-factory': resolve(__dirname, '../../sdk/factory/src'),
      '@fastgpt-plugin/sdk-client': resolve(__dirname, '../../sdk/client/src'),
      'sdk/factory/src': resolve(__dirname, '../../sdk/factory/src/index.ts'),
      'sdk/factory/dist': resolve(__dirname, '../../sdk/factory/src/index.ts'),
      'sdk/client/src': resolve(__dirname, '../../sdk/client/src/index.ts'),
      'sdk/client/dist': resolve(__dirname, '../../sdk/client/src/index.ts'),
      '@domain': resolve(__dirname, '../../packages/domain/src'),
      '@usecase': resolve(__dirname, '../../packages/usecase/src'),
      '@shared': resolve(__dirname, '../../packages/shared/src'),
      '@interface-adapter': resolve(__dirname, '../../packages/interface-adapter/src'),
      '@infrastructure': resolve(__dirname, '../../packages/infrastructure/src')
    }
  },
  plugins: [
    tsconfigPaths({
      projects: ['./tsconfig.json', '../../tsconfig.json']
    })
  ],

  test: {
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['src/templates/**']
  }
});
