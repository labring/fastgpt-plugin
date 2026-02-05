import { existsSync } from 'node:fs';
import { join, resolve, parse } from 'node:path';
import { isProd } from '@/constants';
import type { DatasetSourceId } from './type/source';
import { mod } from '@/lib/logger';
import { mimeMap } from '@/lib/s3/const';
import { getLogger } from '@logtape/logtape';
import { getPublicS3Server } from '@/lib/s3';

const logger = getLogger(mod.dataset);

const UploadDatasetSourcesS3Path = '/system/plugin/dataset-sources';

// Supported image formats for logo files
const logoFormats = ['svg', 'png', 'jpeg', 'webp', 'jpg'];

// Logo types: color (logo.*) and outline (logo-outline.*)
const logoTypes = ['logo', 'logo-outline'] as const;
type LogoType = (typeof logoTypes)[number];

type LogoItem = {
  path: string;
  sourceId: string;
  logoType: LogoType;
};

/**
 * Find logo file with supported formats in the given directory
 * @param directory Directory to search in
 * @param prefix Logo file prefix ('logo' or 'logo-outline')
 * @returns Logo file path if found, null otherwise
 */
function findLogoFile(directory: string, prefix: string = 'logo'): string | null {
  for (const format of logoFormats) {
    const logoPath = join(directory, `${prefix}.${format}`);
    if (existsSync(logoPath)) {
      return logoPath;
    }
  }
  return null;
}

/**
 * Get dataset source logos from the source code (development only)
 */
const getDevelopmentDatasetSourceLogos = async (): Promise<LogoItem[]> => {
  const sourcesDir = resolve('../modules/dataset/sources');
  const { readdir, stat } = await import('node:fs/promises');
  const result: LogoItem[] = [];

  try {
    const sourceNames = await readdir(sourcesDir);

    for (const sourceId of sourceNames) {
      const sourcePath = join(sourcesDir, sourceId);

      // Skip if it's not a directory
      const stats = await stat(sourcePath);
      if (!stats.isDirectory()) {
        continue;
      }

      // Find both logo and logo-outline files
      for (const logoType of logoTypes) {
        const logoPath = findLogoFile(sourcePath, logoType);
        if (logoPath) {
          result.push({ path: logoPath, sourceId, logoType });
        }
      }
    }
  } catch (error) {
    logger.error('Failed to read development dataset sources directory', { error });
  }

  return result;
};

/**
 * Get dataset source logos from the built distribution (production)
 * Production files are named: {sourceId}.{ext} or {sourceId}-outline.{ext}
 */
const getProductionDatasetSourceLogos = async (): Promise<LogoItem[]> => {
  const avatarsDir = resolve('dist/dataset/avatars');
  if (!existsSync(avatarsDir)) {
    logger.warn('Production dataset avatars directory not found');
    return [];
  }

  const { readdir } = await import('node:fs/promises');

  try {
    const files = await readdir(avatarsDir);
    const result: LogoItem[] = [];

    for (const file of files) {
      if (file.startsWith('.')) continue; // Skip hidden files

      const filePath = join(avatarsDir, file);
      const fileExt = parse(file).ext.toLowerCase();

      // Check if it's a supported image format
      if (logoFormats.some((format) => `.${format}` === fileExt)) {
        const baseName = parse(file).name;
        // Check if it's an outline logo (ends with -outline)
        const isOutline = baseName.endsWith('-outline');
        const sourceId = isOutline ? baseName.replace(/-outline$/, '') : baseName;
        const logoType: LogoType = isOutline ? 'logo-outline' : 'logo';

        result.push({ path: filePath, sourceId, logoType });
      }
    }

    return result;
  } catch (error) {
    logger.error('Failed to read production dataset source avatars', { error });
    return [];
  }
};

/**
 * Read and upload a single logo file to S3
 */
const uploadLogoFile = async (
  logoPath: string,
  sourceId: string,
  logoType: LogoType
): Promise<void> => {
  // Parse file information
  const parsedPath = parse(logoPath);
  const fileExt = parsedPath.ext.toLowerCase();
  const publicS3Server = getPublicS3Server();

  if (!fileExt) {
    logger.warn(`No file extension found for: ${logoPath}`);
    return;
  }

  const mimeType = mimeMap[fileExt];
  if (!mimeType) {
    logger.warn(`Unsupported MIME type for extension: ${fileExt}`);
    return;
  }

  try {
    await publicS3Server.uploadFileAdvanced({
      path: logoPath,
      prefix: UploadDatasetSourcesS3Path.replace('/', '') + `/${sourceId}`,
      keepRawFilename: true,
      contentType: mimeType,
      defaultFilename: logoType
    });
    logger.info(
      `📦 Uploaded dataset source avatar: ${sourceId}/${logoType} -> ${`${UploadDatasetSourcesS3Path}/${sourceId}/${logoType}`}`
    );
  } catch (error) {
    logger.error(`Failed to upload ${sourceId}/${logoType}: ${String(error)}`);
    throw error;
  }
};

/**
 * Initialize and upload dataset source logos to S3
 * This function should be called after S3 initialization
 */
export const initDatasetSourceAvatars = async () => {
  try {
    logger.info('Starting dataset source avatars initialization...');

    let logoItems: LogoItem[];

    if (!isProd) {
      // Development: get actual files from source directory
      logoItems = await getDevelopmentDatasetSourceLogos();
      logger.info('Running in development mode, reading from source files...');
    } else {
      // Production: read from simplified avatars directory
      logoItems = await getProductionDatasetSourceLogos();
      logger.info('Running in production mode, reading from dist/dataset/avatars...');
    }

    await Promise.allSettled(
      logoItems.map(async ({ path: logoPath, sourceId, logoType }) => {
        if (!sourceId) {
          logger.warn(`Invalid logo path format: ${logoPath}`);
          return;
        }
        if (!existsSync(logoPath)) {
          logger.warn(`Logo file not found: ${logoPath}, skipping ${sourceId}/${logoType}`);
          return;
        }
        await uploadLogoFile(logoPath, sourceId, logoType);
        return { sourceId, logoType };
      })
    );

    logger.info(`✅ Dataset source avatars initialization completed.`);
  } catch (error) {
    logger.error('❌ Dataset source avatars initialization failed', { error });
    throw error;
  }
};

/**
 * Get full S3 URL for a dataset source avatar (color version)
 * Returns complete URL that can be used directly in Avatar component
 * @param sourceId - The dataset source ID
 * @returns Full S3 URL for the avatar
 */
export const getDatasetSourceAvatarUrl = (sourceId: DatasetSourceId): string => {
  const publicS3Server = getPublicS3Server();
  return publicS3Server.generateExternalUrl(
    `${UploadDatasetSourcesS3Path.slice(1)}/${sourceId}/logo`
  );
};

/**
 * Get full S3 URL for a dataset source outline avatar
 * Returns complete URL that can be used directly in Avatar component
 * @param sourceId - The dataset source ID
 * @returns Full S3 URL for the outline avatar
 */
export const getDatasetSourceOutlineAvatarUrl = (sourceId: DatasetSourceId): string => {
  const publicS3Server = getPublicS3Server();
  return publicS3Server.generateExternalUrl(
    `${UploadDatasetSourcesS3Path.slice(1)}/${sourceId}/logo-outline`
  );
};
