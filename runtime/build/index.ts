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

// 4. copy aiproxy channel avatars for production use
const channelAvatarDir = join(__dirname, '..', '..', 'modules', 'model', 'channelAvatar');
if (existsSync(channelAvatarDir)) {
  const destDir = join(__dirname, '..', '..', 'dist', 'model', 'channel-avatars');
  await cp(channelAvatarDir, destDir, { recursive: true });
  console.log(`✅ Copied aiproxy channel avatars to dist/model/channel-avatars`);
} else {
  console.log('⚠️ Channel avatar directory not found, skipping channel avatar copy');
}

await $`bun run build:main`;
