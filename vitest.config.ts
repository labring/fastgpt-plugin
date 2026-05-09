import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: 'test/setup.ts',
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['json', 'html', 'json-summary'],
      enabled: true,
      reportOnFailure: true,
      cleanOnRerun: false,
      include: ['apps/**/*.ts', 'packages/**/src/*.ts', 'sdk/**/*.ts']
    },
    reporters: ['github-actions', 'default'],
    include: ['apps/**/*.test.ts', 'packages/**/*.test.ts', 'sdk/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@tool': resolve(__dirname, 'modules/tool'),
      '@domain': resolve(__dirname, 'packages/domain/src'),
      '@usecase': resolve(__dirname, 'packages/usecase/src'),
      '@shared': resolve(__dirname, 'packages/shared/src'),
      '@interface-adapter': resolve(__dirname, 'packages/interface-adapter/src'),
      '@infrastructure': resolve(__dirname, 'packages/infrastructure/src'),
      '@fastgpt-plugin/cli': resolve(__dirname, 'apps/cli/src')
    }
  }
});
