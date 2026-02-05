import { defineConfig } from 'tsdown';
import { globSync } from 'glob';
import { basename } from 'path';

// 查找所有 worker 文件
const workerFiles = globSync('src/workers/*.ts');

// 生成 entry 对象：{ 'workers/workerName': 'src/workers/workerName.ts' }
const workerEntries = workerFiles.reduce(
  (acc, file) => {
    const name = basename(file, '.ts');
    acc[`workers/${name}`] = file;
    return acc;
  },
  {} as Record<string, string>
);

export default defineConfig({
  entry: {
    // 主入口
    main: 'main.ts',
    // Worker 文件
    ...workerEntries
  },
  format: 'esm',
  clean: true,
  dts: {
    enabled: false
  },
  outExtensions() {
    return {
      js: '.js'
    };
  },
  // 为不同的入口使用不同的配置
  onSuccess: async () => {
    console.log(
      '✓ Compiled workers:',
      Object.keys(workerEntries)
        .map((k) => k.replace('workers/', ''))
        .join(', ')
    );
  }
});
