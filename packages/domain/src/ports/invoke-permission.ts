import {
  PluginPermissionEnum,
  type PluginPermissionEnumType
} from '../value-objects/permission.vo';

import {
  InvokeMethodEnum,
  InvokeMethodEnumSchema,
  type InvokeMethodType
} from './invoke.port';

export type KnownInvokeMethodType = Exclude<
  InvokeMethodType,
  typeof InvokeMethodEnum.unknown
>;

export const InvokeMethodPermission = {
  [InvokeMethodEnum.uploadFile]: PluginPermissionEnum['file-upload:allow'],
  [InvokeMethodEnum.userInfo]: PluginPermissionEnum['userInfo:read'],
  [InvokeMethodEnum.wecomCorpToken]: PluginPermissionEnum['teamInfo:read']
} satisfies Record<KnownInvokeMethodType, PluginPermissionEnumType>;

export function getInvokeMethodPermission(method: string): PluginPermissionEnumType | undefined {
  const parsed = InvokeMethodEnumSchema.safeParse(method);
  if (!parsed.success || parsed.data === InvokeMethodEnum.unknown) {
    return undefined;
  }
  return InvokeMethodPermission[parsed.data];
}
