import { describe, it, expect } from 'vitest';
import { InputType } from '../src';

describe('aliDocParse Input Validation', () => {
  const validBase = {
    accessKeyId: 'test-id',
    accessKeySecret: 'test-secret',
    fileUrl: 'https://example.com/document.pdf',
    fileType: 'pdf' as const
  };

  it('should reject empty accessKeyId', () => {
    expect(() => InputType.parse({ ...validBase, accessKeyId: '' })).toThrow();
  });

  it('should reject empty accessKeySecret', () => {
    expect(() => InputType.parse({ ...validBase, accessKeySecret: '' })).toThrow();
  });

  it('should reject invalid fileUrl', () => {
    expect(() => InputType.parse({ ...validBase, fileUrl: 'not-a-url' })).toThrow();
  });

  it('should reject unsupported fileType', () => {
    expect(() => InputType.parse({ ...validBase, fileType: 'pptx' as never })).toThrow();
  });

  it('should accept all supported file types', () => {
    const types = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'html', 'epub', 'mobi', 'md', 'txt'];
    for (const fileType of types) {
      expect(() => InputType.parse({ ...validBase, fileType })).not.toThrow();
    }
  });

  it('should parse valid input', () => {
    const result = InputType.parse(validBase);
    expect(result.accessKeyId).toBe('test-id');
    expect(result.fileType).toBe('pdf');
  });
});
