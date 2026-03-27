import { SystemCacheKeyEnum } from './type';
import { getLogger, infra } from '../logger';

export const initCache = () => {
  const logger = getLogger(infra.redis);
  logger.info('initing cache');
  global.systemCache = {
    [SystemCacheKeyEnum.systemTool]: {
      versionKey: '',
      data: null,
      refreshFunc: async () => null
    }
  };
};
