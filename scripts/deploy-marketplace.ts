// 1. build all tools && data.json
// 2. upload to s3

import { mimeMap } from '@/s3/const';
import { pkg } from '@/utils/zip';
import { UploadToolsS3Path } from '@tool/constants';
import { $ } from 'bun';
import { glob } from 'fs/promises';
import {
  createStorage,
  MinioStorageAdapter,
  type IAwsS3CompatibleStorageOptions,
  type ICosStorageOptions,
  type IOssStorageOptions
} from '@fastgpt-sdk/storage';
import { createDefaultStorageOptions } from '@/s3/config';

async function main() {
  let config: any;
  const { vendor, publicBucket, credentials, region, ...options } = createDefaultStorageOptions();
  if (vendor === 'minio') {
    config = {
      region,
      vendor,
      credentials,
      forcePathStyle: true,
      endpoint: options.endpoint!,
      maxRetries: options.maxRetries!
    } as Omit<IAwsS3CompatibleStorageOptions, 'bucket'>;
  } else if (vendor === 'aws-s3') {
    config = {
      region,
      vendor,
      credentials,
      endpoint: options.endpoint!,
      maxRetries: options.maxRetries!
    } as Omit<IAwsS3CompatibleStorageOptions, 'bucket'>;
  } else if (vendor === 'cos') {
    config = {
      region,
      vendor,
      credentials,
      proxy: options.proxy,
      domain: options.domain,
      protocol: options.protocol,
      useAccelerate: options.useAccelerate
    } as Omit<ICosStorageOptions, 'bucket'>;
  } else if (vendor === 'oss') {
    config = {
      region,
      vendor,
      credentials,
      endpoint: options.endpoint!,
      cname: options.cname,
      internal: options.internal,
      secure: options.secure,
      enableProxy: options.enableProxy
    } as Omit<IOssStorageOptions, 'bucket'>;
  }

  console.log('🚀 Starting marketplace deployment...');

  const storage = createStorage({ bucket: publicBucket, ...config });
  await storage.ensureBucket();
  if (vendor === 'minio') {
    await (storage as MinioStorageAdapter).ensurePublicBucketPolicy();
  }

  console.log('📦 Building marketplace packages...');
  await $`bun run build:marketplace`;

  console.log('📤 Uploading packages to S3...');
  // read all files in dist/pkgs
  const pkgs = glob('dist/pkgs/*');
  for await (const pkg of pkgs) {
    const filename = pkg.split('/').at(-1) as string;
    await storage.uploadObject({
      key: `pkgs/${filename}`,
      body: Buffer.from(await Bun.file(`${pkg}`).arrayBuffer())
    });
  }

  // write data.json
  console.log('📤 Uploading tools.json...');
  await storage.uploadObject({
    key: `/data.json`,
    body: Buffer.from(await Bun.file('./dist/tools.json').arrayBuffer())
  });

  console.log('📤 Uploading logos and assets...');
  const imgs = glob('modules/tool/packages/*/logo.*');
  const childrenDirs = glob('modules/tool/packages/*/children/*');
  const readmes = glob('modules/tool/packages/*/README.md');
  const assets = glob('modules/tool/packages/*/assets/*');

  for await (const img of imgs) {
    const toolId = img.split('/').at(-2) as string;
    const ext = ('.' + img.split('.').at(-1)) as string;
    storage.uploadObject({
      key: `${UploadToolsS3Path}/${toolId}/logo`,
      body: Buffer.from(await Bun.file(img).arrayBuffer()),
      contentType: mimeMap[ext]
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
      storage.uploadObject({
        key: `${UploadToolsS3Path}/${toolId}/${childId}/logo`,
        body: Buffer.from(await Bun.file(childLogo).arrayBuffer()),
        contentType: mimeMap[ext]
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
        storage.uploadObject({
          key: `${UploadToolsS3Path}/${toolId}/${childId}/logo`,
          body: Buffer.from(await Bun.file(parentLogo).arrayBuffer()),
          contentType: mimeMap[ext]
        });
      }
    }
  }

  // readme
  for await (const readme of readmes) {
    const toolId = readme.split('/').at(-2) as string;
    storage.uploadObject({
      key: `${UploadToolsS3Path}/${toolId}/README.md`,
      body: Buffer.from(await Bun.file(readme).arrayBuffer())
    });
  }

  // assets
  for await (const asset of assets) {
    const toolId = asset.split('/').at(-3) as string;
    const assetName = asset.split('/').at(-1) as string;
    storage.uploadObject({
      key: `${UploadToolsS3Path}/${toolId}/assets/${assetName}`,
      body: Buffer.from(await Bun.file(asset).arrayBuffer()),
      contentType: mimeMap[assetName.split('.').at(-1) as string]
    });
  }

  console.log('✅ Assets uploaded successfully');

  await pkg('./dist/pkgs', './dist/pkgs.pkg');
  await storage.uploadObject({
    key: `pkgs.zip`,
    body: Buffer.from(await Bun.file('./dist/pkgs.pkg').arrayBuffer())
  });

  console.log('✅ pkgs.zip uploaded successfully');

  if (process.env.MARKETPLACE_BASE_URL && process.env.MARKETPLACE_AUTH_TOKEN) {
    console.log('🚀 Starting marketplace update...');
    await fetch(`${process.env.MARKETPLACE_BASE_URL}/api/admin/refresh`, {
      method: 'GET',
      headers: {
        Authorization: process.env.MARKETPLACE_AUTH_TOKEN
      }
    });
    console.log('✅ Marketplace updated successfully');
  }
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
