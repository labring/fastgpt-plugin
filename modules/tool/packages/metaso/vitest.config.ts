import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    testTimeout: 30000, // 30秒超时，因为需要调用外部API
    hookTimeout: 30000
  },
  resolve: {
    alias: {
      '@': '.'
    }
  }
});
