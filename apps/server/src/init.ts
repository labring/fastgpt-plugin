import {
  localFileStorageRepo,
  mongoClient,
  privateRemoteFileStorageRepo,
  publicRemoteFileStorageRepo
} from './deps';

export const init = async () => {
  await Promise.all([
    localFileStorageRepo.initialize(),
    privateRemoteFileStorageRepo.init(),
    publicRemoteFileStorageRepo.init(),
    mongoClient.init()
  ]);
};
