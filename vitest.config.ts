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
    include: ['apps/**/*.test.ts', 'packages/**/src/*.test.ts', 'sdk/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@tool': resolve(__dirname, 'modules/tool')
    }
  }
});
