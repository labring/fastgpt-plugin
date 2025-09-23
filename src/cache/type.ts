import type { ToolType } from '@tool/type';

export enum SystemCacheKeyEnum {
  systemTool = 'systemTool'
}

export type SystemCacheDataType = {
  [SystemCacheKeyEnum.systemTool]: ToolType[];
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
