import { mongoClient, privateRemoteFileStorageRepo, publicRemoteFileStorageRepo } from './deps';

export const init = async () => {
  await privateRemoteFileStorageRepo.init();
  await publicRemoteFileStorageRepo.init();
  await mongoClient.init();
};
