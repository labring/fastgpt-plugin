// 1. build all tools && data.json
// 2. upload to s3

import { mimeMap } from '@/s3/const';
import { UploadToolsS3Path } from '@tool/constants';
import { $, S3Client } from 'bun';
import { glob } from 'fs/promises';

const endpoint = process.env.S3_ENDPOINT; // should be http://localhost:9000
const secretKey = process.env.S3_SECRET_KEY;
const accessKey = process.env.S3_ACCESS_KEY;
const bucket = process.env.S3_BUCKET;

async function main() {
  const client = new S3Client({
    endpoint,
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
    bucket
  });

  await $`bun run build:marketplace`;

  // read all files in dist/pkgs
  const pkgs = glob('dist/pkgs/*');
  for await (const pkg of pkgs) {
    const filename = pkg.split('/').at(-1) as string;
    await client.write(`/pkgs/${filename}`, Bun.file(`${pkg}`));
  }

  // write data.json
  await client.write(`/data.json`, Bun.file('./dist/tools.json'));

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

  console.log('Assets uploaded successfully');
}

if (import.meta.main) {
  await main();
}
