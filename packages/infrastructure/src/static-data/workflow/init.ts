import { createHash } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path, { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { IStorage } from '@fastgpt-sdk/storage';

import type { TemplateItemType, TemplateListType } from '@domain/entities/workflow.entity';
import type { RemoteFileStoragePort } from '@domain/ports/file-storage/remote-file-storage.port';
import { getMimeTypeFromFilename } from '@domain/value-objects/file/MIME.vo';
import { env } from '@infrastructure/env';
import { getLogger, mod } from '@infrastructure/logger';
import type { RedisClient } from '@infrastructure/redis/redis-client';

const logger = getLogger(mod.workflow);

const WORKFLOW_STATIC_DATA_DIGEST_KEY = 'workflow:static-data:digest';
const WORKFLOW_LOGO_BASE_PATH = path.posix.join(env.S3_FILE_BASE_PATH, 'workflow', 'templates');
const WORKFLOW_LOGO_PATH = path.posix.join('workflow', 'templates');
const WORKFLOW_LOGO_EXTENSIONS = ['svg', 'png', 'jpeg', 'webp', 'jpg'] as const;

type WorkflowStaticAssetS3Clients = {
  internalClient: IStorage;
  externalClient?: IStorage;
};

type WorkflowAvatarUrlResolver = Pick<RemoteFileStoragePort, 'getAccessUrl'>;

type WorkflowAvatarItem = {
  name: string;
  logoPath: string;
  objectPath: string;
};

type WorkflowTemplateStaticType = Omit<TemplateItemType, 'avatar'>;

export const workflows: WorkflowTemplateStaticType[] = [];

const workflowTemplateDirs = [
  fileURLToPath(new URL('./templates', import.meta.url)),
  fileURLToPath(new URL('./workflows', import.meta.url)),
  fileURLToPath(new URL('./workflows/templates', import.meta.url)),
  join(process.cwd(), 'dist', 'workflows', 'templates'),
  join(process.cwd(), 'dist', 'workflows')
];

function getWorkflowTemplateDir() {
  const target = workflowTemplateDirs.find((dir) => {
    if (!existsSync(dir)) return false;

    return readdirSync(dir, { withFileTypes: true }).some(
      (entry) => entry.isDirectory() && existsSync(path.join(dir, entry.name, 'workflow.json'))
    );
  });
  if (!target) {
    throw new Error('Workflow template directory not found');
  }
  return target;
}

const getWorkflowAvatarFileKey = (slug: string) =>
  path.posix.join(WORKFLOW_LOGO_PATH, slug, 'logo');

const getWorkflowAvatarObjectKey = (slug: string) =>
  path.posix.join(WORKFLOW_LOGO_BASE_PATH, slug, 'logo');

export const getWorkflowAvatarUrl = async (
  slug: string,
  publicRemoteFileStorageRepo: WorkflowAvatarUrlResolver
) => {
  const [url, err] = await publicRemoteFileStorageRepo.getAccessUrl(getWorkflowAvatarFileKey(slug));
  if (err) {
    return Promise.reject(err.error ?? err);
  }

  return url;
};

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

async function calculateWorkflowStaticDataDigest() {
  const workflowTemplateDir = getWorkflowTemplateDir();
  const files = (await collectFilesRecursively(workflowTemplateDir)).sort();
  const hash = createHash('md5');

  for (const filePath of files) {
    const relativePath = path.relative(workflowTemplateDir, filePath).split(path.sep).join('/');
    hash.update(relativePath);
    hash.update(':');
    hash.update(await readFile(filePath));
    hash.update('\n');
  }

  return hash.digest('hex');
}

function findLogoFile(directory: string): string | null {
  for (const extension of WORKFLOW_LOGO_EXTENSIONS) {
    const logoPath = path.join(directory, `logo.${extension}`);
    if (existsSync(logoPath)) {
      return logoPath;
    }
  }

  return null;
}

async function listWorkflowAvatarItems(): Promise<WorkflowAvatarItem[]> {
  const workflowTemplateDir = getWorkflowTemplateDir();
  const entries = await readdir(workflowTemplateDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const templateDir = path.join(workflowTemplateDir, entry.name);
      if (!existsSync(path.join(templateDir, 'workflow.json'))) {
        return null;
      }

      const logoPath = findLogoFile(templateDir);
      if (!logoPath) {
        throw new Error(`Workflow template logo not found: ${entry.name}`);
      }

      return {
        name: entry.name,
        logoPath,
        objectPath: getWorkflowAvatarObjectKey(entry.name)
      } satisfies WorkflowAvatarItem;
    })
    .filter((item): item is WorkflowAvatarItem => item !== null);
}

async function uploadWorkflowStaticAsset(
  { name, logoPath, objectPath }: WorkflowAvatarItem,
  s3Clients: WorkflowStaticAssetS3Clients
) {
  const contentType = getMimeTypeFromFilename(logoPath) ?? 'application/octet-stream';

  await s3Clients.internalClient.uploadObject({
    key: objectPath,
    body: await readFile(logoPath),
    contentType,
    contentDisposition: `inline; filename="logo${path.extname(logoPath)}"`
  });

  logger.debug('Workflow static asset uploaded', {
    name,
    objectPath
  });
}

export async function initStaticWorkflowAssets({
  redisClient,
  s3Clients
}: {
  redisClient: RedisClient;
  // 头像初始化暂时仍保留底层上传能力，因为现有 file storage save 会固定为 attachment。
  s3Clients: WorkflowStaticAssetS3Clients;
}) {
  const digest = await calculateWorkflowStaticDataDigest();
  const currentDigest = await redisClient.getClient.get(WORKFLOW_STATIC_DATA_DIGEST_KEY);

  if (currentDigest === digest) {
    logger.info('Workflow static data digest unchanged, skip re-uploading workflow assets');
    return;
  }

  const assetItems = await listWorkflowAvatarItems();
  logger.info('Workflow static data changed, uploading workflow assets', {
    count: assetItems.length
  });

  await Promise.all(assetItems.map((item) => uploadWorkflowStaticAsset(item, s3Clients)));
  await redisClient.getClient.set(WORKFLOW_STATIC_DATA_DIGEST_KEY, digest);

  logger.info('Workflow assets uploaded and digest refreshed', {
    count: assetItems.length,
    digest
  });
}

export const initWorkflowTemplates = async () => {
  const publicWorkflowsPath = getWorkflowTemplateDir();

  workflows.length = 0;

  // according to the environment to decide to read the way
  const items = await readdir(publicWorkflowsPath, { withFileTypes: true });
  const templateItems = items.filter(
    (item) =>
      item.isDirectory() && existsSync(join(publicWorkflowsPath, item.name, 'workflow.json'))
  );

  for (const item of templateItems) {
    const templatePath = join(publicWorkflowsPath, item.name, 'workflow.json');

    const fileBuffer = await readFile(templatePath, 'utf-8');
    const fileContent = fileBuffer.toString();
    const templateData = JSON.parse(fileContent);

    const template = {
      ...templateData,
      templateId: item.name,
      isActive: true
    } as WorkflowTemplateStaticType;

    workflows.push(template);
  }

  logger.info(`[init] workflow templates count: ${workflows.length}`);
};

export const attachWorkflowAvatarUrls = async (
  templateItems: readonly WorkflowTemplateStaticType[],
  publicRemoteFileStorageRepo: WorkflowAvatarUrlResolver
): Promise<TemplateListType> =>
  Promise.all(
    templateItems.map(async (template) => ({
      ...template,
      avatar: await getWorkflowAvatarUrl(template.templateId, publicRemoteFileStorageRepo)
    }))
  );
