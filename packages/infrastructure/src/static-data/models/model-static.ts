import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { IStorage } from '@fastgpt-sdk/storage';

import type { RemoteFileStoragePort } from '@domain/ports/file-storage/remote-file-storage.port';
import { getMimeTypeFromFilename } from '@domain/value-objects/file/MIME.vo';

import { env } from '../../env';
import { getLogger, mod } from '../../logger';
import type { RedisClient } from '../../redis/redis-client';

import {
  aiproxyIdMap,
  getSortedStaticModelProviders,
  staticModelDataDir,
  staticModelList,
  staticModelProviderDir
} from './index';

const logger = getLogger(mod.model);

const MODEL_STATIC_DATA_DIGEST_KEY = 'model:static-data:digest';
const MODEL_LOGO_BASE_PATH = path.posix.join(env.S3_FILE_BASE_PATH, 'models');
const MODEL_LOGO_EXTENSIONS = ['svg', 'png', 'jpeg', 'webp', 'jpg'] as const;

type ModelStaticAssetS3Clients = {
  internalClient: IStorage;
  externalClient?: IStorage;
};

type ModelAvatarUrlResolver = Pick<RemoteFileStoragePort, 'getAccessUrl'>;

type ModelLogoItem = {
  providerName: string;
  logoPath: string;
};

export { aiproxyIdMap, staticModelList as modelList };

export const getSortedModelProviders = (priority = env.MODEL_PROVIDER_PRIORITY) =>
  getSortedStaticModelProviders(priority);

const getModelLogoFileKey = (providerName: string) =>
  path.posix.join('models', providerName, 'logo');
const getModelLogoObjectKey = (providerName: string) =>
  path.posix.join(MODEL_LOGO_BASE_PATH, providerName, 'logo');

export const getModelAvatarUrl = async (
  providerName: string,
  publicRemoteFileStorageRepo: ModelAvatarUrlResolver
) => {
  const [url, err] = await publicRemoteFileStorageRepo.getAccessUrl(
    getModelLogoFileKey(providerName)
  );
  if (err) {
    return Promise.reject(err.error ?? err);
  }

  return url;
};

function findLogoFile(directory: string): string | null {
  for (const extension of MODEL_LOGO_EXTENSIONS) {
    const logoPath = path.join(directory, `logo.${extension}`);
    if (existsSync(logoPath)) {
      return logoPath;
    }
  }

  return null;
}

async function collectFilesRecursively(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectFilesRecursively(entryPath);
      }
      return [entryPath];
    })
  );

  return files.flat();
}

async function calculateModelStaticDataDigest() {
  const files = (await collectFilesRecursively(staticModelDataDir)).sort();
  const hash = createHash('md5');

  for (const filePath of files) {
    const relativePath = path.relative(staticModelDataDir, filePath).split(path.sep).join('/');
    hash.update(relativePath);
    hash.update(':');
    hash.update(await readFile(filePath));
    hash.update('\n');
  }

  return hash.digest('hex');
}

async function listModelLogoItems(): Promise<ModelLogoItem[]> {
  const entries = await readdir(staticModelProviderDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const logoPath = findLogoFile(path.join(staticModelProviderDir, entry.name));
      if (!logoPath) {
        return null;
      }

      return {
        providerName: entry.name,
        logoPath
      } satisfies ModelLogoItem;
    })
    .filter((item): item is ModelLogoItem => item !== null);
}

async function uploadModelLogo(
  { providerName, logoPath }: ModelLogoItem,
  s3Clients: ModelStaticAssetS3Clients
) {
  const contentType = getMimeTypeFromFilename(logoPath) ?? 'application/octet-stream';

  await s3Clients.internalClient.uploadObject({
    key: getModelLogoObjectKey(providerName),
    body: await readFile(logoPath),
    contentType,
    contentDisposition: `inline; filename="logo${path.extname(logoPath)}"`
  });
}

export async function initStaticModelAssets({
  redisClient,
  s3Clients
}: {
  redisClient: RedisClient;
  // logo 初始化暂时仍保留底层上传能力，因为现有 file storage save 会固定为 attachment。
  s3Clients: ModelStaticAssetS3Clients;
}) {
  const digest = await calculateModelStaticDataDigest();
  const currentDigest = await redisClient.getClient.get(MODEL_STATIC_DATA_DIGEST_KEY);

  if (currentDigest === digest) {
    logger.info('Model static data digest unchanged, skip re-uploading model logos');
    return;
  }

  const logoItems = await listModelLogoItems();
  logger.info('Model static data changed, uploading model logos', {
    count: logoItems.length
  });

  await Promise.all(logoItems.map((item) => uploadModelLogo(item, s3Clients)));
  await redisClient.getClient.set(MODEL_STATIC_DATA_DIGEST_KEY, digest);

  logger.info('Model logos uploaded and digest refreshed', {
    count: logoItems.length,
    digest
  });
}
