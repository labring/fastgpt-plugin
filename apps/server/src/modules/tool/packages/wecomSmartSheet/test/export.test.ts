import { describe, it, expect } from 'vitest';
import { tool as tableTool, InputType as TableInput } from '../children/wecomSmartSheetTable/src';
import {
  tool as fieldSimpleTool,
  InputType as FieldSimpleInput
} from '../children/wecomSmartSheetFieldSimple/src';
import {
  tool as fieldAdvancedTool,
  InputType as FieldAdvancedInput
} from '../children/wecomSmartSheetFieldAdvanced/src';
import {
  tool as recordSimpleTool,
  InputType as RecordSimpleInput
} from '../children/wecomSmartSheetRecordSimple/src';
import {
  tool as recordAdvancedTool,
  InputType as RecordAdvancedInput
} from '../children/wecomSmartSheetRecordAdvanced/src';
import { tool as docTool, InputType as DocInput } from '../children/wecomSmartSheetDoc/src';
import { tool as viewTool, InputType as ViewInput } from '../children/wecomSmartSheetView/src';

describe('WeCom Smart Sheet Toolset Export Test', () => {
  describe('Function Exports', () => {
    it('should export all tool functions', () => {
      expect(typeof tableTool).toBe('function');
      expect(typeof fieldSimpleTool).toBe('function');
      expect(typeof fieldAdvancedTool).toBe('function');
      expect(typeof recordSimpleTool).toBe('function');
      expect(typeof recordAdvancedTool).toBe('function');
      expect(typeof docTool).toBe('function');
      expect(typeof viewTool).toBe('function');
    });
  });

  describe('Schema Validation', () => {
    it('Table Tool Schema', () => {
      const result = TableInput.safeParse({ accessToken: 'test', docid: 'test', action: 'get' });
      expect(result.success).toBe(true);
    });

    it('Field Simple Tool Schema', () => {
      const result = FieldSimpleInput.safeParse({
        accessToken: 'test',
        docid: 'test',
        sheet_id: 'test',
        action: 'add',
        field_title: 'test',
        field_type: 'FIELD_TYPE_TEXT'
      });
      expect(result.success).toBe(true);
    });

    it('Field Advanced Tool Schema', () => {
      const result = FieldAdvancedInput.safeParse({
        accessToken: 'test',
        docid: 'test',
        sheet_id: 'test',
        action: 'add',
        data: {}
      });
      expect(result.success).toBe(true);
    });

    it('Record Simple Tool Schema', () => {
      const result = RecordSimpleInput.safeParse({
        accessToken: 'test',
        docid: 'test',
        sheet_id: 'test',
        action: 'add',
        data: { title: 'hello' }
      });
      expect(result.success).toBe(true);
    });

    it('Doc Tool Schema', () => {
      const result = DocInput.safeParse({
        accessToken: 'test',
        doc_name: 'test'
      });
      expect(result.success).toBe(true);
    });

    it('View Tool Schema', () => {
      const result = ViewInput.safeParse({
        accessToken: 'test',
        docid: 'test',
        sheet_id: 'test',
        action: 'list'
      });
      expect(result.success).toBe(true);
    });
  });
});
