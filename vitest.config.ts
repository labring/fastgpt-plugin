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
      include: ['runtime/**/*.ts', 'modules/**/src/*.ts', 'apps/**/*.ts']
      // exclude: ['**/node_modules/**', '**/dist/**', 'modules/**/*.ts']
    },
    reporters: ['github-actions', 'default'],
    include: ['runtime/**/*.test.ts', 'modules/**/*.test.ts', 'apps/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@tool': resolve(__dirname, 'modules/tool')
    }
  }
});
