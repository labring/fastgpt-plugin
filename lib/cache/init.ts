import { initTools } from '@tool/init';
import { SystemCacheKeyEnum } from './type';

export const initCache = () => {
  global.systemCache = {
    [SystemCacheKeyEnum.systemTool]: {
      versionKey: '',
      data: new Map(),
      refreshFunc: initTools
    }
  };
};
