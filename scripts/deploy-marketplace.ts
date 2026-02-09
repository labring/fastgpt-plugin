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
  type IOssStorageOptions,
  type IStorage
} from '@fastgpt-sdk/storage';
import { createDefaultStorageOptions } from '@/s3/config';
import type { ToolSetType, ToolType } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';
import { existsSync, writeFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { generateToolVersion, generateToolSetVersion } from '../modules/tool/utils/tool';
import { ToolDetailSchema } from '@tool/type/api';

const filterToolList = ['.DS_Store', '.git', '.github', 'node_modules', 'dist', 'scripts'];

const LoadToolsDev = async (filename: string, storage: IStorage): Promise<ToolType[]> => {
  const tools: ToolType[] = [];
  const basePath = process.cwd();
  const toolPath = join(basePath, 'modules', 'tool', 'packages', filename);

  // get all avatars and push them into s3
  const rootMod = (await import(toolPath)).default as ToolSetType | ToolType;

  const childrenPath = join(toolPath, 'children');
  const isToolSet = existsSync(childrenPath);

  const toolsetId = rootMod.toolId || filename;

  // 使用传入的 storage 来生成 URL
  const generateUrl = (path: string) => {
    const { url } = storage.generatePublicGetUrl({ key: path });
    return url;
  };

  const parentIcon = rootMod.icon ?? generateUrl(`${UploadToolsS3Path}/${toolsetId}/logo`);

  if (isToolSet) {
    const children: ToolType[] = [];

    {
      const files = await readdir(childrenPath);
      for (const file of files) {
        const childPath = join(childrenPath, file);

        const childMod = (await import(childPath)).default as ToolType;
        const toolId = childMod.toolId || `${toolsetId}/${file}`;

        const childIcon =
          childMod.icon ??
          rootMod.icon ??
          generateUrl(`${UploadToolsS3Path}/${toolsetId}/${file}/logo`);

        // Generate version for child tool
        const childVersion = childMod.versionList
          ? generateToolVersion(childMod.versionList)
          : generateToolVersion([]);

        children.push({
          ...childMod,
          toolId,
          toolFilename: filename,
          icon: childIcon,
          parentId: toolsetId,
          version: childVersion
        });
      }
    }

    // Generate version for tool set based on children
    const toolSetVersion = generateToolSetVersion(children) ?? '';

    tools.push({
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon: parentIcon,
      toolFilename: filename,
      cb: () => Promise.resolve({}),
      versionList: [],
      version: toolSetVersion
    });

    tools.push(...children);
  } else {
    // is not toolset
    const icon = rootMod.icon ?? generateUrl(`${UploadToolsS3Path}/${toolsetId}/logo`);

    // Generate version for single tool
    const toolVersion = (rootMod as any).versionList
      ? generateToolVersion((rootMod as any).versionList)
      : generateToolVersion([]);

    tools.push({
      ...(rootMod as ToolType),
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon,
      toolFilename: filename,
      version: toolVersion
    });
  }

  return tools;
};

const buildToolsJson = async (storage: IStorage) => {
  console.log('📝 Building tools.json...');

  const basePath = process.cwd();
  const dir = join(basePath, 'modules', 'tool', 'packages');
  const dirs = (await readdir(dir)).filter((filename) => !filterToolList.includes(filename));
  const devTools = (
    await Promise.all(
      dirs.map(async (filename) => {
        return LoadToolsDev(filename, storage);
      })
    )
  ).flat();
  const toolMap = new Map();
  for (const tool of devTools) {
    toolMap.set(tool.toolId, tool);
  }

  const toolList = Array.from(toolMap.values()).map((item) => ToolDetailSchema.parse(item));
  writeFileSync(join(basePath, 'dist', 'tools.json'), JSON.stringify(toolList));

  console.log('✅ tools.json built successfully, tools:', toolList.length);
};

async function main() {
  let config: any;
  const { vendor, publicBucket, credentials, region, ...options } = createDefaultStorageOptions();
  if (vendor === 'minio') {
    config = {
      region,
      vendor,
      credentials,
      endpoint: options.endpoint!,
      maxRetries: options.maxRetries!,
      forcePathStyle: options.forcePathStyle,
      publicAccessExtraSubPath: options.publicAccessExtraSubPath
    } as Omit<IAwsS3CompatibleStorageOptions, 'bucket'>;
  } else if (vendor === 'aws-s3') {
    config = {
      region,
      vendor,
      credentials,
      endpoint: options.endpoint!,
      maxRetries: options.maxRetries!,
      forcePathStyle: options.forcePathStyle,
      publicAccessExtraSubPath: options.publicAccessExtraSubPath
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

  try {
    await storage.ensureBucket();
    if (storage instanceof MinioStorageAdapter) {
      await storage.ensurePublicBucketPolicy();
    }
  } catch (error) {
    console.error('Failed to ensure bucket exists:', { error });
  }

  console.log('📦 Building marketplace packages...');
  // 先构建 pkg
  await $`bun run build:pkg`;

  // 然后构建 tools.json，使用正确的 storage 实例
  await buildToolsJson(storage);

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
    try {
      await fetch(`${process.env.MARKETPLACE_BASE_URL}/api/admin/refresh`, {
        method: 'GET',
        headers: {
          Authorization: process.env.MARKETPLACE_AUTH_TOKEN
        }
      });
    } catch (error) {
      console.error('❌ Marketplace update failed:');
      console.error(error);
    }
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
