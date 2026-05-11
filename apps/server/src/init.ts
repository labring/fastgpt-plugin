import { makePluginRegisterActiveUC } from '@usecase/plugin/plugin-register-active.uc';
import { configureLogger, getLogger, root } from '@infrastructure/logger';
import { initStaticModelAssets } from '@infrastructure/static-data/models/model-static';
import { initWorkflowTemplates } from '@infrastructure/static-data/workflow/init';

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
  const logger = getLogger(root);
  await Promise.all([
    localFileStorageRepo.initialize(),
    privateRemoteFileStorageRepo.init(),
    publicRemoteFileStorageRepo.init(),
    mongoClient.init()
  ]);

  try {
    await Promise.all([
      initStaticModelAssets({
        redisClient,
        s3Clients: s3PublicClients
      }),
      initWorkflowTemplates()
    ]);
  } catch (error) {
    logger.error('Init static data failed', { error });
    return Promise.reject(error);
  }

  // TODO: 应当只载入 system 安装的插件
  const pluginRegisterActiveUC = makePluginRegisterActiveUC({
    pluginRepo,
    pluginRuntimeManager
  });

  const [, err] = await pluginRegisterActiveUC();
  if (err) {
    logger.error('Register active plugins on init failed', {
      error: err.error,
      reason: err.reason
    });
    return Promise.reject(err.error ?? err);
  }
  logger.info('Register active plugins on init completed');
};
