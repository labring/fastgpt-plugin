import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'tsdown';

const configDir = dirname(fileURLToPath(import.meta.url));
const modelProviderDir = join(
  configDir,
  '../../packages/infrastructure/src/static-data/models/provider'
);
const sdkFactoryDir = join(configDir, '../../sdk/factory');
const modelLogoExtensions = ['svg', 'png', 'jpeg', 'webp', 'jpg'];

const modelLogoCopyEntries = readdirSync(modelProviderDir, { withFileTypes: true }).flatMap(
  (entry) => {
    if (!entry.isDirectory()) return [];

    const logoFile = modelLogoExtensions
      .map((extension) => join(modelProviderDir, entry.name, `logo.${extension}`))
      .find((file) => existsSync(file));

    if (!logoFile) return [];

    return [
      {
        from: logoFile,
        to: `dist/provider/${entry.name}`
      }
    ];
  }
);

export default defineConfig({
  entry: {
    main: 'main.ts'
  },
  deps: {
    alwaysBundle: [/^@fastgpt-plugin\//]
  },
  format: 'esm',
  clean: true,
  copy: [
    ...modelLogoCopyEntries,
    {
      from: '../../packages/infrastructure/src/static-data/workflow/templates',
      to: 'dist'
    },
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
