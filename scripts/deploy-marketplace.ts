// 1. build all tools && data.json
// 2. upload to s3

import { mimeMap } from '@/s3/const';
import { pkg } from '@/utils/zip';
import { UploadToolsS3Path } from '@tool/constants';
import { $, S3Client } from 'bun';
import { glob } from 'fs/promises';

const endpoint = process.env.S3_ENDPOINT; // should be http://localhost:9000
const secretKey = process.env.S3_SECRET_KEY;
const accessKey = process.env.S3_ACCESS_KEY;
const bucket = process.env.S3_BUCKET;

async function main() {
  // Validate required environment variables
  if (!endpoint || !secretKey || !accessKey || !bucket) {
    console.error('❌ Missing required environment variables:');
    if (!endpoint) console.error('  - S3_ENDPOINT');
    if (!secretKey) console.error('  - S3_SECRET_KEY');
    if (!accessKey) console.error('  - S3_ACCESS_KEY');
    if (!bucket) console.error('  - S3_BUCKET');
    process.exit(1);
  }

  console.log('🚀 Starting marketplace deployment...');

  const client = new S3Client({
    endpoint,
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
    bucket
  });

  console.log('📦 Building marketplace packages...');
  await $`bun run build:marketplace`;

  console.log('📤 Uploading packages to S3...');
  // read all files in dist/pkgs
  const pkgs = glob('dist/pkgs/*');
  for await (const pkg of pkgs) {
    const filename = pkg.split('/').at(-1) as string;
    await client.write(`/pkgs/${filename}`, Bun.file(`${pkg}`));
  }

  // write data.json
  console.log('📤 Uploading tools.json...');
  await client.write(`/data.json`, Bun.file('./dist/tools.json'));

  console.log('📤 Uploading logos and assets...');
  const imgs = glob('modules/tool/packages/*/logo.*');
  const childrenDirs = glob('modules/tool/packages/*/children/*');
  const readmes = glob('modules/tool/packages/*/README.md');
  const assets = glob('modules/tool/packages/*/assets/*');

  for await (const img of imgs) {
    const toolId = img.split('/').at(-2) as string;
    const ext = ('.' + img.split('.').at(-1)) as string;
    client.write(`${UploadToolsS3Path}/${toolId}/logo`, Bun.file(img), {
      type: mimeMap[ext]
    });
  }

  // Handle children logos - use parent logo if child doesn't have its own logo
  for await (const childDir of childrenDirs) {
    const toolId = childDir.split('/').at(-3) as string;
    const childId = childDir.split('/').at(-1) as string;

    // Check if child has its own logo
    const childLogoPattern = `${childDir}/logo.*`;
    const childLogoFiles = [];
    for await (const file of glob(childLogoPattern)) {
      childLogoFiles.push(file);
    }

    if (childLogoFiles.length > 0) {
      // Child has its own logo, use it
      const childLogo = childLogoFiles[0];
      const ext = ('.' + childLogo.split('.').at(-1)) as string;
      client.write(`${UploadToolsS3Path}/${toolId}/${childId}/logo`, Bun.file(childLogo), {
        type: mimeMap[ext]
      });
    } else {
      // Child doesn't have logo, use parent's logo
      const parentLogoPattern = `modules/tool/packages/${toolId}/logo.*`;
      const parentLogoFiles = [];
      for await (const file of glob(parentLogoPattern)) {
        parentLogoFiles.push(file);
      }

      if (parentLogoFiles.length > 0) {
        const parentLogo = parentLogoFiles[0];
        const ext = ('.' + parentLogo.split('.').at(-1)) as string;
        client.write(`${UploadToolsS3Path}/${toolId}/${childId}/logo`, Bun.file(parentLogo), {
          type: mimeMap[ext]
        });
      }
    }
  }

  // readme
  for await (const readme of readmes) {
    const toolId = readme.split('/').at(-2) as string;
    client.write(`${UploadToolsS3Path}/${toolId}/README.md`, Bun.file(readme));
  }

  // assets
  for await (const asset of assets) {
    const toolId = asset.split('/').at(-3) as string;
    const assetName = asset.split('/').at(-1) as string;
    client.write(`${UploadToolsS3Path}/${toolId}/assets/${assetName}`, Bun.file(asset), {
      type: mimeMap[assetName.split('.').at(-1) as string]
    });
  }

  console.log('✅ Assets uploaded successfully');

  await pkg('./dist/pkgs', './dist/pkgs.pkg');
  await client.write(`/pkgs.zip`, Bun.file('./dist/pkgs.pkg'));

  console.log('✅ pkgs.zip uploaded successfully');

  if (!process.env.MARKETPLACE_BASE_URL || !process.env.MARKETPLACE_AUTH_TOKEN) {
    console.error('❌ Missing required environment variables:');
    if (!process.env.MARKETPLACE_BASE_URL) console.error('  - MARKETPLACE_BASE_URL');
    if (!process.env.MARKETPLACE_AUTH_TOKEN) console.error('  - MARKETPLACE_AUTH_TOKEN');
    process.exit(1);
  }

  console.log('🚀 Starting marketplace update...');

  // update marketplace
  await fetch(`${process.env.MARKETPLACE_BASE_URL}/api/admin/refresh`, {
    method: 'GET',
    headers: {
      Authorization: process.env.MARKETPLACE_AUTH_TOKEN
    }
  });
}

if (import.meta.main) {
  try {
    await main();
    console.log('✅ Marketplace deployment completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Marketplace deployment failed:');
    console.error(error);
    process.exit(1);
  }
}
