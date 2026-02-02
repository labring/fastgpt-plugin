import { initTools } from '@tool/init';
import { SystemCacheKeyEnum } from './type';
import { getLogger } from '@logtape/logtape';
import { infra } from '@/logger';

export const initCache = () => {
  const logger = getLogger(infra.redis);
  logger.info('initing cache');
  global.systemCache = {
    [SystemCacheKeyEnum.systemTool]: {
      versionKey: '',
      data: new Map(),
      refreshFunc: initTools
    }
  };
};
