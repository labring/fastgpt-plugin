import { describe, expect, it } from 'vitest';

import { PluginPermissionEnum } from '../value-objects/permission.vo';

import { InvokeMethodEnum, InvokeMethodEnumSchema } from './invoke.port';
import { getInvokeMethodPermission } from './invoke-permission';

describe('InvokeMethodEnumSchema & Permissions', () => {
  describe('InvokeMethodEnumSchema', () => {
    it('parses valid invoke methods correctly', () => {
      expect(InvokeMethodEnumSchema.parse('uploadFile')).toBe(
        InvokeMethodEnum.uploadFile
      );
      expect(InvokeMethodEnumSchema.parse('userInfo')).toBe(
        InvokeMethodEnum.userInfo
      );
      expect(InvokeMethodEnumSchema.parse('wecomCorpToken')).toBe(
        InvokeMethodEnum.wecomCorpToken
      );
    });

    it('falls back to unknown when receiving unrecognized invoke method', () => {
      expect(InvokeMethodEnumSchema.parse('nonExistentMethod')).toBe(
        InvokeMethodEnum.unknown
      );
      expect(InvokeMethodEnumSchema.parse(12345)).toBe(
        InvokeMethodEnum.unknown
      );
      expect(InvokeMethodEnumSchema.parse(null)).toBe(
        InvokeMethodEnum.unknown
      );
    });
  });

  describe('getInvokeMethodPermission', () => {
    it('returns corresponding permission for known methods', () => {
      expect(getInvokeMethodPermission('uploadFile')).toBe(
        PluginPermissionEnum['file-upload:allow']
      );
      expect(getInvokeMethodPermission('userInfo')).toBe(
        PluginPermissionEnum['userInfo:read']
      );
      expect(getInvokeMethodPermission('wecomCorpToken')).toBe(
        PluginPermissionEnum['teamInfo:read']
      );
    });

    it('returns undefined for unknown or invalid method', () => {
      expect(getInvokeMethodPermission('unknown')).toBeUndefined();
      expect(getInvokeMethodPermission('nonExistentMethod')).toBeUndefined();
      expect(getInvokeMethodPermission('')).toBeUndefined();
    });
  });
});
