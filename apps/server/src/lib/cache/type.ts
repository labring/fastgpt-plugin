import type { CacheToolMapType } from '@/modules/tool/types/tool';

export enum SystemCacheKeyEnum {
  systemTool = 'systemTool'
}

export type SystemCacheDataType = {
  [SystemCacheKeyEnum.systemTool]: CacheToolMapType;
};

type SystemCacheType = {
  [K in SystemCacheKeyEnum]: {
    versionKey: string;
    data: SystemCacheDataType[K];
    refreshFunc: () => Promise<SystemCacheDataType[K]>;
  };
};

declare global {
  var systemCache: SystemCacheType;
}
