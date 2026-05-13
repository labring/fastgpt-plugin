import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['json', 'html', 'json-summary', 'text'],
      enabled: true,
      include: ['src/**/*.uc.ts', 'src/plugin/plugin-replace-active.ts'],
      thresholds: {
        branches: 100,
        lines: 80,
        statements: 80,
        functions: 80
      }
    },
    reporters: ['default'],
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**']
  },
  resolve: {
    alias: {
      '@domain': resolve(__dirname, '../domain/src'),
      '@usecase': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, '../shared/src')
    }
  }
});
