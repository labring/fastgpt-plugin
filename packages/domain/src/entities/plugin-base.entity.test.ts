import { describe, expect, it } from 'vitest';

import {
  PluginStatusEnum,
  PluginStatusEnumSchema,
  PluginTagEnum,
  PluginTagSchema,
  PluginTypeEnum,
  PluginTypeSchema
} from './plugin-base.entity';

describe('plugin-base.entity enum schemas', () => {
  describe('PluginTagSchema', () => {
    it('parses valid tags correctly', () => {
      expect(PluginTagSchema.parse('tools')).toBe(PluginTagEnum.tools);
      expect(PluginTagSchema.parse('search')).toBe(PluginTagEnum.search);
      expect(PluginTagSchema.parse('other')).toBe(PluginTagEnum.other);
    });

    it('falls back to other when receiving unrecognized tag', () => {
      expect(PluginTagSchema.parse('blockchain')).toBe(PluginTagEnum.other);
      expect(PluginTagSchema.parse('unknown_tag_123')).toBe(PluginTagEnum.other);
      expect(PluginTagSchema.parse(123)).toBe(PluginTagEnum.other);
      expect(PluginTagSchema.parse(null)).toBe(PluginTagEnum.other);
    });
  });

  describe('PluginTypeSchema', () => {
    it('parses valid plugin types correctly', () => {
      expect(PluginTypeSchema.parse('tool')).toBe(PluginTypeEnum.tool);
    });

    it('falls back to unknown when receiving unrecognized plugin type', () => {
      expect(PluginTypeSchema.parse('agent')).toBe(PluginTypeEnum.unknown);
      expect(PluginTypeSchema.parse('model')).toBe(PluginTypeEnum.unknown);
      expect(PluginTypeSchema.parse(undefined)).toBe(PluginTypeEnum.unknown);
    });
  });

  describe('PluginStatusEnumSchema', () => {
    it('parses valid plugin statuses correctly', () => {
      expect(PluginStatusEnumSchema.parse('active')).toBe(PluginStatusEnum.active);
      expect(PluginStatusEnumSchema.parse('pending')).toBe(PluginStatusEnum.pending);
      expect(PluginStatusEnumSchema.parse('disabled')).toBe(PluginStatusEnum.disabled);
    });

    it('falls back to unknown when receiving unrecognized plugin status', () => {
      expect(PluginStatusEnumSchema.parse('archived')).toBe(PluginStatusEnum.unknown);
      expect(PluginStatusEnumSchema.parse('deprecated')).toBe(PluginStatusEnum.unknown);
      expect(PluginStatusEnumSchema.parse(null)).toBe(PluginStatusEnum.unknown);
    });
  });
});
