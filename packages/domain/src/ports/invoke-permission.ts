import {
  PluginPermissionEnum,
  type PluginPermissionEnumType
} from '../value-objects/permission.vo';

import {
  InvokeMethodEnum,
  InvokeMethodEnumSchema,
  type InvokeMethodType
} from './invoke.port';

export const InvokeMethodPermission = {
  [InvokeMethodEnum.uploadFile]: PluginPermissionEnum['file-upload:allow'],
  [InvokeMethodEnum.userInfo]: PluginPermissionEnum['userInfo:read'],
  [InvokeMethodEnum.wecomCorpToken]: PluginPermissionEnum['teamInfo:read']
} satisfies Record<InvokeMethodType, PluginPermissionEnumType>;

export function getInvokeMethodPermission(method: string): PluginPermissionEnumType | undefined {
  const parsed = InvokeMethodEnumSchema.safeParse(method);
  return parsed.success ? InvokeMethodPermission[parsed.data] : undefined;
}
