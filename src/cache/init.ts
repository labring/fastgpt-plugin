import { refreshUploadedTools } from '@tool/controller';
import { SystemCacheKeyEnum } from './type';

export const initCache = () => {
  global.systemCache = {
    [SystemCacheKeyEnum.systemTool]: {
      syncKey: '',
      data: [],
      refreshFunc: refreshUploadedTools
    }
  };
};
