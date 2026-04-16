import { makePluginRegisterActiveUC } from '@usecase/plugin/plugin-register-active.uc';
import { configureLogger, getLogger, root } from '@infrastructure/logger';
import { initStaticModelAssets } from '@infrastructure/static-data/models/model-static';

import {
  localFileStorageRepo,
  mongoClient,
  pluginRepo,
  pluginRuntimeManager,
  privateRemoteFileStorageRepo,
  publicRemoteFileStorageRepo,
  redisClient,
  s3PublicClients
} from './deps';

export const init = async () => {
  await configureLogger(); // setup logger
  await Promise.all([
    localFileStorageRepo.initialize(),
    privateRemoteFileStorageRepo.init(),
    publicRemoteFileStorageRepo.init(),
    mongoClient.init()
  ]);

  const logger = getLogger(root);

  try {
    await initStaticModelAssets({
      redisClient,
      s3Clients: s3PublicClients
    });
  } catch (error) {
    logger.error('Init model static assets failed', { error });
    return Promise.reject(error);
  }

  const pluginRegisterActiveUC = makePluginRegisterActiveUC({
    pluginRepo,
    pluginRuntimeManager
  });

  const [res, err] = await pluginRegisterActiveUC();
  logger.info('Register active plugins on init completed', {
    result: res,
    error: err
  });
  if (err) {
    logger.error('Register active plugins on init failed', {
      error: err.error,
      reason: err.reason
    });
    return Promise.reject(err.error ?? err);
  }
};
