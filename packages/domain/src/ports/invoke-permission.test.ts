import { describe, expect, it } from 'vitest';

import { PluginPermissionEnum, PluginPermissionEnumSchema } from '../value-objects/permission.vo';

import { InvokeMethodEnum } from './invoke.port';
import { getInvokeMethodPermission, InvokeMethodPermission } from './invoke-permission';

describe('invoke-permission', () => {
  it('maps chatCompletion to model:invoke permission', () => {
    expect(PluginPermissionEnumSchema.safeParse('model:invoke')).toEqual({
      success: true,
      data: 'model:invoke'
    });
    expect(InvokeMethodPermission[InvokeMethodEnum.chatCompletion]).toBe(
      PluginPermissionEnum['model:invoke']
    );
    expect(getInvokeMethodPermission('chatCompletion')).toBe('model:invoke');
  });

  it('maps existing invoke methods to their required permissions and rejects unknown methods', () => {
    expect(getInvokeMethodPermission('uploadFile')).toBe('file-upload:allow');
    expect(getInvokeMethodPermission('userInfo')).toBe('userInfo:read');
    expect(getInvokeMethodPermission('wecomCorpToken')).toBe('teamInfo:read');
    expect(getInvokeMethodPermission('unknownMethod')).toBeUndefined();
    expect(getInvokeMethodPermission('')).toBeUndefined();
  });
});
