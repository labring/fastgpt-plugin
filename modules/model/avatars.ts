import { existsSync } from 'node:fs';
import { join, resolve, parse } from 'node:path';
import { publicS3Server } from '@/s3';
import { mimeMap } from '@/s3/const';
import { getLogger, mod } from '@/logger';

const logger = getLogger(mod.model);
import { isProd } from '@/constants';

const UploadModelsS3Path = 'system/plugin/models';
const UploadChannelAvatarS3Path = 'system/plugin/model-channel';

// Supported image formats for logo files
const logoFormats = ['svg', 'png', 'jpeg', 'webp', 'jpg'];

/**
 * Find logo file with supported formats in the given directory
 * @param directory Directory to search in
 * @returns Logo file path if found, null otherwise
 */
function findLogoFile(directory: string): string | null {
  for (const format of logoFormats) {
    const logoPath = join(directory, `logo.${format}`);
    if (existsSync(logoPath)) {
      return logoPath;
    }
  }
  return null;
}

/**
 * Get model provider logos from the source code (development only)
 */
const getDevelopmentModelLogos = async (): Promise<
  Array<{ path: string; providerName: string }>
> => {
  const providerDir = resolve('../modules/model/provider');
  const { readdir } = await import('node:fs/promises');
  const result: Array<{ path: string; providerName: string }> = [];

  try {
    const providerNames = await readdir(providerDir);

    for (const providerName of providerNames) {
      const providerPath = join(providerDir, providerName);

      // Skip if it's not a directory
      if (!existsSync(providerPath) || !require('fs').statSync(providerPath).isDirectory()) {
        continue;
      }

      // Find logo file with any supported format
      const logoPath = findLogoFile(providerPath);
      if (logoPath) {
        result.push({ path: logoPath, providerName });
      }
    }
  } catch (error) {
    logger.error('Failed to read development model provider directory:', { error });
  }

  return result;
};

/**
 * Get model provider logos from the built distribution (production)
 */
const getProductionModelLogos = async (): Promise<
  Array<{ path: string; providerName: string }>
> => {
  const avatarsDir = resolve('dist/model/avatars');
  if (!existsSync(avatarsDir)) {
    logger.warn('Production avatars directory not found');
    return [];
  }

  const { readdir } = await import('node:fs/promises');

  try {
    const files = await readdir(avatarsDir);
    const result: Array<{ path: string; providerName: string }> = [];

    for (const file of files) {
      if (file.startsWith('.')) continue; // Skip hidden files

      const filePath = join(avatarsDir, file);
      const fileExt = parse(file).ext.toLowerCase();

      // Check if it's a supported image format
      if (logoFormats.some((format) => `.${format}` === fileExt)) {
        // Provider name is filename without extension
        const providerName = parse(file).name;
        result.push({ path: filePath, providerName });
      }
    }

    return result;
  } catch (error) {
    logger.error('Failed to read production model avatars:', { error });
    return [];
  }
};

/**
 * Read and upload a single logo file to S3
 */
const uploadLogoFile = async (
  logoPath: string,
  name: string,
  s3BasePath: string
): Promise<void> => {
  // Parse file information
  const parsedPath = parse(logoPath);
  const fileExt = parsedPath.ext.toLowerCase();

  if (!fileExt) {
    logger.warn(`No file extension found for: ${logoPath}`);
    return;
  }

  const mimeType = mimeMap[fileExt];
  if (!mimeType) {
    logger.warn(`Unsupported MIME type for extension: ${fileExt}`);
    return;
  }

  await publicS3Server.uploadFileAdvanced({
    path: logoPath,
    prefix: `${s3BasePath}/${name}`,
    keepRawFilename: true,
    contentType: mimeType,
    defaultFilename: 'logo'
  });
  logger.debug(`📦 Uploaded avatar: ${name} -> ${s3BasePath}/${name}/logo`);
};

/**
 * Initialize and upload model provider logos to S3
 * This function should be called after S3 initialization
 */
export const initModelAvatars = async () => {
  try {
    logger.info('Starting model avatars initialization...');

    let logoItems: Array<{ path: string; providerName: string }>;

    if (!isProd) {
      // Development: get actual files from source directory
      logoItems = await getDevelopmentModelLogos();
      logger.info('Running in development mode, reading from source files...');
    } else {
      // Production: read from simplified avatars directory
      logoItems = await getProductionModelLogos();
      logger.info('Running in production mode, reading from dist/model/avatars...');
    }

    await Promise.allSettled(
      logoItems.map(async ({ path: logoPath, providerName }) => {
        if (!providerName) {
          logger.warn(`Invalid logo path format: ${logoPath}`);
          return;
        }
        if (!existsSync(logoPath)) {
          logger.warn(`Logo file not found: ${logoPath}, skipping ${providerName}`);
          return;
        }
        await uploadLogoFile(logoPath, providerName, UploadModelsS3Path);
      })
    );

    logger.info('✅ Model avatars initialization completed.');
  } catch (error) {
    logger.error('❌ Model avatars initialization failed:', { error });
    throw error;
  }
};

/**
 * Get S3 URL for a model provider avatar
 * @param providerName - The model provider name
 * @returns Complete S3 URL for the avatar
 */
export const getModelAvatarUrl = async (providerName: string): Promise<string> => {
  const s3Path = `${UploadModelsS3Path}/${providerName}/logo`;
  return publicS3Server.generateExternalUrl(s3Path);
};

/**
 * Collect channel avatar files by slug from a flat directory
 */
const collectChannelAvatarsFrom = async (
  dir: string
): Promise<Array<{ path: string; slug: string }>> => {
  if (!existsSync(dir)) {
    logger.warn(`Channel avatar directory not found: ${dir}`);
    return [];
  }

  const { readdir } = await import('node:fs/promises');
  try {
    const files = await readdir(dir);
    const result: Array<{ path: string; slug: string }> = [];

    for (const file of files) {
      if (file.startsWith('.')) continue;
      const ext = parse(file).ext.toLowerCase();
      if (logoFormats.some((f) => `.${f}` === ext)) {
        result.push({ path: join(dir, file), slug: parse(file).name });
      }
    }

    return result;
  } catch (error) {
    logger.error(`Failed to read channel avatar directory ${dir}:`, { error });
    return [];
  }
};

/**
 * Initialize and upload aiproxy channel avatars to S3
 */
export const initChannelAvatars = async () => {
  try {
    logger.info('Starting channel avatars initialization...');

    const dir = isProd
      ? resolve('dist/model/channel-avatars')
      : resolve('../modules/model/channelAvatar');

    const items = await collectChannelAvatarsFrom(dir);

    await Promise.allSettled(
      items.map(async ({ path: logoPath, slug }) => {
        if (!slug) {
          logger.warn(`Invalid channel avatar filename: ${logoPath}`);
          return;
        }
        await uploadLogoFile(logoPath, slug, UploadChannelAvatarS3Path);
      })
    );

    logger.info('✅ Channel avatars initialization completed.');
  } catch (error) {
    logger.error('❌ Channel avatars initialization failed:', { error });
    throw error;
  }
};

/**
 * Get S3 URL for an aiproxy channel avatar
 * @param slug - The channel avatar slug (e.g. 'openai', 'doc2x')
 * @returns Complete S3 URL for the avatar
 */
export const getChannelAvatarUrl = (slug: string): string => {
  return publicS3Server.generateExternalUrl(`${UploadChannelAvatarS3Path}/${slug}/logo`);
};
