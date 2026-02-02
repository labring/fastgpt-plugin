import { $ } from 'bun';
import { cp } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

// 1. build worker
await $`bun run build:worker`;

// 2. copy templates
await cp(
  join(__dirname, '..', '..', 'modules', 'workflow', 'templates'),
  join(__dirname, '..', '..', 'dist', 'workflows'),
  {
    recursive: true
  }
);

// 3. copy model provider avatars for production use
const modelProviderDir = join(__dirname, '..', '..', 'modules', 'model', 'provider');
if (existsSync(modelProviderDir)) {
  const avatarsDir = join(__dirname, '..', '..', 'dist', 'model', 'avatars');

  // Create avatars directory if it doesn't exist
  mkdirSync(avatarsDir, { recursive: true });

  // Copy only logo files and rename them to provider name
  const { readdir } = await import('node:fs/promises');
  const providers = await readdir(modelProviderDir, { withFileTypes: true });

  for (const provider of providers) {
    if (provider.isDirectory()) {
      const providerDir = join(modelProviderDir, provider.name);
      const { readdir } = await import('node:fs/promises');
      const files = await readdir(providerDir);

      // Find logo file (could be logo.svg, logo.png, etc.)
      const logoFile = files.find((file) => file.startsWith('logo.'));
      if (logoFile) {
        const srcPath = join(providerDir, logoFile);
        const ext = logoFile.split('.').pop();
        const destPath = join(avatarsDir, `${provider.name}.${ext}`);

        await cp(srcPath, destPath);
        console.log(`📦 Copied avatar: ${provider.name} -> ${provider.name}.${ext}`);
      }
    }
  }

  console.log(`✅ Copied model provider avatars to dist/model/avatars`);
} else {
  console.log('⚠️ Model provider directory not found, skipping avatar copy');
}

// 4. copy dataset source avatars for production use (both color and outline versions)
const datasetSourcesDir = join(__dirname, '..', '..', 'modules', 'dataset', 'sources');
if (existsSync(datasetSourcesDir)) {
  const datasetAvatarsDir = join(__dirname, '..', '..', 'dist', 'dataset', 'avatars');

  // Create avatars directory if it doesn't exist
  mkdirSync(datasetAvatarsDir, { recursive: true });

  // Copy logo files (both logo.* and logo-outline.*) and rename them
  const { readdir } = await import('node:fs/promises');
  const sources = await readdir(datasetSourcesDir, { withFileTypes: true });

  for (const source of sources) {
    if (source.isDirectory()) {
      const sourceDir = join(datasetSourcesDir, source.name);
      const files = await readdir(sourceDir);

      // Find and copy color logo (logo.*)
      const logoFile = files.find((file) => /^logo\.[^-]/.test(file));
      if (logoFile) {
        const srcPath = join(sourceDir, logoFile);
        const ext = logoFile.split('.').pop();
        const destPath = join(datasetAvatarsDir, `${source.name}.${ext}`);

        await cp(srcPath, destPath);
        console.log(`📦 Copied dataset source avatar: ${source.name} -> ${source.name}.${ext}`);
      }

      // Find and copy outline logo (logo-outline.*)
      const outlineFile = files.find((file) => file.startsWith('logo-outline.'));
      if (outlineFile) {
        const srcPath = join(sourceDir, outlineFile);
        const ext = outlineFile.split('.').pop();
        const destPath = join(datasetAvatarsDir, `${source.name}-outline.${ext}`);

        await cp(srcPath, destPath);
        console.log(
          `📦 Copied dataset source outline avatar: ${source.name} -> ${source.name}-outline.${ext}`
        );
      }
    }
  }

  console.log(`✅ Copied dataset source avatars to dist/dataset/avatars`);
} else {
  console.log('⚠️ Dataset sources directory not found, skipping avatar copy');
}

await $`bun run build:main`;
