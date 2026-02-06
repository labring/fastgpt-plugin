import { getLogger, infra } from '../logger';
import { S3PrivateService, S3PublicService } from './controller';

const logger = getLogger(infra.storage);

export const initS3Service = async () => {
  try {
    await S3PublicService.getInstance().checkHealth();
  } catch (error) {
    logger.error(`S3PublicService checkHealth failed: ${JSON.stringify(error, null, 2)}`, {
      error
    });
  }

  try {
    await S3PrivateService.getInstance().checkHealth();
  } catch (error) {
    logger.error(`S3PrivateService checkHealth failed: ${JSON.stringify(error, null, 2)}`, {
      error
    });
  }
};

export const getPublicS3Server = () => {
  return S3PublicService.getInstance();
};

export const getPrivateS3Server = () => {
  return S3PrivateService.getInstance();
};
