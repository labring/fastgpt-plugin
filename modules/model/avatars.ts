import { glob } from 'fs/promises';
import { join } from 'path';
import { publicS3Server } from '@/s3';
import { mimeMap } from '@/s3/const';
import { addLog } from '@/utils/log';

const UploadModelsS3Path = '/system/plugin/models';

/**
 * Initialize and upload model provider logos to S3
 * This function should be called after S3 initialization
 */
export const initModelAvatars = async () => {
  try {
    addLog.info('Starting model avatars initialization...');

    // Get all model provider logo files
    const modelProviderLogos = glob('modules/model/provider/*/logo.*');

    let uploadedCount = 0;

    for await (const logoPath of modelProviderLogos) {
      try {
        // Extract provider name from path: modules/model/provider/{ProviderName}/logo.svg
        const pathParts = logoPath.split('/');
        const providerName = pathParts[3]; // provider directory name

        if (!providerName) {
          addLog.warn(`Invalid logo path format: ${logoPath}`);
          continue;
        }

        // Get file extension for MIME type
        const ext = logoPath.split('.').pop();
        if (!ext) {
          addLog.warn(`No file extension found for: ${logoPath}`);
          continue;
        }

        const mimeType = mimeMap[`.${ext.toLowerCase()}`];
        if (!mimeType) {
          addLog.warn(`Unsupported MIME type for extension: .${ext}`);
          continue;
        }

        // Read file and upload to S3
        const file = Bun.file(logoPath);
        const s3Path = `${UploadModelsS3Path}/${providerName}/logo`;

        await publicS3Server.uploadFileAdvanced({
          path: logoPath,
          prefix: UploadModelsS3Path.replace('/', '') + `/${providerName}`,
          keepRawFilename: true,
          contentType: mimeType
        });

        uploadedCount++;
        addLog.info(`📦 Uploaded model avatar: ${providerName} -> ${s3Path}`);
      } catch (error) {
        addLog.error(`Failed to upload model avatar for ${logoPath}:`, error);
      }
    }

    addLog.info(`✅ Model avatars initialization completed. Uploaded ${uploadedCount} avatars.`);
  } catch (error) {
    addLog.error('❌ Model avatars initialization failed:', error);
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
  return await publicS3Server.generateExternalUrl(s3Path);
};
