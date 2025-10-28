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
    await client.write(`/pkgs/${pkg}`, Bun.file(`${pkg}`));
  }

  // write data.json
  await client.write(`/data.json`, Bun.file('./dist/tools.json'));

  const imgs = glob('modules/tool/packages/*/logo.*');
  const childrenImgs = glob('modules/tool/packages/*/children/*/logo.*');
  const readmes = glob('modules/tool/packages/*/README.md');
  const assets = glob('modules/tool/packages/*/assets/*');

  for await (const img of imgs) {
    const toolId = img.split('/').at(-2) as string;
    const ext = img.split('.').at(-1) as string;
    client.write(`${UploadToolsS3Path}/${toolId}/logo`, Bun.file(img), {
      type: mimeMap[ext]
    });
  }

  for await (const img of childrenImgs) {
    const toolId = img.split('/').at(-4) as string;
    const childId = img.split('/').at(-2) as string;
    const ext = img.split('.').at(-1) as string;
    client.write(`${UploadToolsS3Path}/${toolId}/${childId}/logo`, Bun.file(img), {
      type: mimeMap[ext]
    });
  }

  // readme
  for await (const readme of readmes) {
    const toolId = readme.split('/').at(-2) as string;
    client.write(`${UploadToolsS3Path}/${toolId}/README.md`, Bun.file(readme));
  }

  // assets
  for await (const asset of assets) {
    const toolId = asset.split('/').at(-2) as string;
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
