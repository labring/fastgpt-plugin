import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'tsdown';

const configDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(configDir, '../../../../../../../../..');
const sdkFactoryDir = join(repoRoot, 'sdk/factory');

export default defineConfig({
  entry: {
    bootstrap: join(configDir, 'src/bootstrap.ts')
  },
  format: 'esm',
  outDir: join(configDir, 'dist'),
  tsconfig: join(repoRoot, 'tsconfig.json'),
  clean: true,
  copy: [
    {
      from: join(sdkFactoryDir, 'package.json'),
      to: 'dist/runtime-sdk/@fastgpt-plugin/sdk-factory'
    },
    {
      from: join(sdkFactoryDir, 'dist/*'),
      to: 'dist/runtime-sdk/@fastgpt-plugin/sdk-factory/dist'
    }
  ],
  dts: {
    enabled: false
  },
  outExtensions() {
    return {
      js: '.js'
    };
  }
});
