import type { MongoClient } from '../../../../storage/mongo';
import { PluginRuntimeConfigRepo } from '../../plugin-runtime-config.repo';

import { CoworkerdPluginRuntimeDriver, type CoworkerdRuntimeDeps } from './coworkerd-runtime.driver';

type CoworkerdRuntimeFactoryDeps = Omit<CoworkerdRuntimeDeps, 'configRepo'> & {
  mongoClient: MongoClient;
};

/** Creates the driver with namespaced persisted config; entry resolution and bundling stay injectable. */
export function createCoworkerdPluginRuntimeDriver(
  deps: CoworkerdRuntimeFactoryDeps
): CoworkerdPluginRuntimeDriver {
  const configRepo = new PluginRuntimeConfigRepo(
    { mongoClient: deps.mongoClient },
    deps.defaultPluginConfig,
    'coworkerd'
  );
  return new CoworkerdPluginRuntimeDriver({ ...deps, configRepo });
}
