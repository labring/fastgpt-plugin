import { refreshUploadedTools } from '@tool/controller';
import { SystemCacheKeyEnum } from './type';

export const initCache = () => {
  global.systemCache = {
    [SystemCacheKeyEnum.systemTool]: {
      versionKey: '',
      data: [],
      refreshFunc: refreshUploadedTools
    }
  };
};
