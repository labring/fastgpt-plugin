import type { ToolMapType } from '@tool/type';

export enum SystemCacheKeyEnum {
  systemTool = 'systemTool'
}

export type SystemCacheDataType = {
  [SystemCacheKeyEnum.systemTool]: ToolMapType;
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
