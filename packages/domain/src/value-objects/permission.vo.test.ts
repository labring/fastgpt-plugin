import { describe, expect, it } from 'vitest';

import {
  PluginPermissionEnum,
  PluginPermissionEnumSchema
} from './permission.vo';

describe('PluginPermissionEnumSchema', () => {
  it('parses valid permissions correctly', () => {
    expect(PluginPermissionEnumSchema.parse('userInfo:read')).toBe(
      PluginPermissionEnum['userInfo:read']
    );
    expect(PluginPermissionEnumSchema.parse('teamInfo:read')).toBe(
      PluginPermissionEnum['teamInfo:read']
    );
    expect(PluginPermissionEnumSchema.parse('model:read')).toBe(
      PluginPermissionEnum['model:read']
    );
    expect(PluginPermissionEnumSchema.parse('dataset:read')).toBe(
      PluginPermissionEnum['dataset:read']
    );
    expect(PluginPermissionEnumSchema.parse('file-upload:allow')).toBe(
      PluginPermissionEnum['file-upload:allow']
    );
  });

  it('falls back to unknown when receiving unrecognized permission', () => {
    expect(PluginPermissionEnumSchema.parse('admin:all')).toBe(
      PluginPermissionEnum.unknown
    );
    expect(PluginPermissionEnumSchema.parse('database:write')).toBe(
      PluginPermissionEnum.unknown
    );
    expect(PluginPermissionEnumSchema.parse(null)).toBe(
      PluginPermissionEnum.unknown
    );
  });
});
