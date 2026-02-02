import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tool } from '../src';

// Mock the uploadFile function
vi.mock('@tool/utils/uploadFile', () => ({
  uploadFile: vi.fn()
}));

import { uploadFile } from '@tool/utils/uploadFile';

describe('DocDiff Tool Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Validation', () => {
    it('should reject empty original text', async () => {
      await expect(
        tool({
          originalText: '',
          originalTitle: '原始文档',
          modifiedText: 'Some content',
          modifiedTitle: '修改后文档',
          title: ''
        })
      ).rejects.toThrow('原始文档内容不能为空');
    });

    it('should reject empty modified text', async () => {
      await expect(
        tool({
          originalText: 'Some content',
          originalTitle: '原始文档',
          modifiedText: '',
          modifiedTitle: '修改后文档',
          title: ''
        })
      ).rejects.toThrow('修改后文档内容不能为空');
    });

    it('should accept valid inputs and return HTML URL', async () => {
      const mockUrl = 'https://example.com/test-report.html';
      vi.mocked(uploadFile).mockResolvedValue({
        accessUrl: mockUrl,
        originalFilename: 'docdiff_report.html',
        contentType: 'text/html',
        size: 1000,
        uploadTime: new Date(),
        objectName: 'test-object'
      });

      const result = await tool({
        originalText: '# Test Document\n\nThis is a test.',
        originalTitle: '原始文档',
        modifiedText: '# Test Document\n\nThis is a modified test.',
        modifiedTitle: '修改后文档',
        title: 'Test Report'
      });

      expect(result).toHaveProperty('htmlUrl');
      expect(typeof result.htmlUrl).toBe('string');
      expect(result.htmlUrl).toBe(mockUrl);
      expect(uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          buffer: expect.any(Object),
          defaultFilename: 'docdiff_report.html',
          contentType: 'text/html'
        })
      );
    });

    it('should accept valid inputs with custom title', async () => {
      const mockUrl = 'https://example.com/custom-report.html';
      vi.mocked(uploadFile).mockResolvedValue({
        accessUrl: mockUrl,
        originalFilename: 'docdiff_report.html',
        contentType: 'text/html',
        size: 1000,
        uploadTime: new Date(),
        objectName: 'test-object'
      });

      const result = await tool({
        originalText: '# Test Document\n\nThis is a test.',
        originalTitle: '原始文档',
        modifiedText: '# Test Document\n\nThis is a modified test.',
        modifiedTitle: '修改后文档',
        title: '自定义对比报告'
      });

      expect(result.htmlUrl).toBe(mockUrl);
      expect(uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultFilename: 'docdiff_report.html'
        })
      );
    });
  });

  describe('Document Comparison Logic', () => {
    it('should handle identical documents', async () => {
      const mockUrl = 'https://example.com/identical-report.html';
      vi.mocked(uploadFile).mockResolvedValue({
        accessUrl: mockUrl,
        originalFilename: 'docdiff_report.html',
        contentType: 'text/html',
        size: 1000,
        uploadTime: new Date(),
        objectName: 'test-object'
      });

      const content = '# Test Document\n\nThis is a test.\n\nAnother paragraph.';
      const result = await tool({
        originalText: content,
        originalTitle: '原始文档',
        modifiedText: content,
        modifiedTitle: '修改后文档',
        title: 'Test Report'
      });

      expect(result.htmlUrl).toBe(mockUrl);

      // Verify the uploaded HTML contains expected content
      const uploadCall = vi.mocked(uploadFile).mock.calls[0][0];
      const htmlContent = Buffer.isBuffer(uploadCall.buffer)
        ? uploadCall.buffer.toString('utf-8')
        : Buffer.from(uploadCall.buffer || '').toString('utf-8');

      expect(htmlContent).toContain('修改');
      expect(htmlContent).toContain('📄 原始文档');
      expect(htmlContent).toContain('📝 修改后文档');
      expect(htmlContent).toContain('3'); // unchanged count
    });

    it('should detect added paragraphs', async () => {
      const mockUrl = 'https://example.com/added-report.html';
      vi.mocked(uploadFile).mockResolvedValue({
        accessUrl: mockUrl,
        originalFilename: 'docdiff_report.html',
        contentType: 'text/html',
        size: 1000,
        uploadTime: new Date(),
        objectName: 'test-object'
      });

      const original = '# Original Document\n\nFirst paragraph.';
      const modified =
        '# Original Document\n\nFirst paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
      const result = await tool({
        originalText: original,
        originalTitle: '原始文档',
        modifiedText: modified,
        modifiedTitle: '修改后文档',
        title: 'Test Report'
      });

      expect(result.htmlUrl).toBe(mockUrl);

      const uploadCall = vi.mocked(uploadFile).mock.calls[0][0];
      const htmlContent = Buffer.isBuffer(uploadCall.buffer)
        ? uploadCall.buffer.toString('utf-8')
        : Buffer.from(uploadCall.buffer || '').toString('utf-8');

      expect(htmlContent).toContain('新增');
      expect(htmlContent).toContain('Second paragraph.');
      expect(htmlContent).toContain('Third paragraph.');
    });

    it('should detect removed paragraphs', async () => {
      const mockUrl = 'https://example.com/removed-report.html';
      vi.mocked(uploadFile).mockResolvedValue({
        accessUrl: mockUrl,
        originalFilename: 'docdiff_report.html',
        contentType: 'text/html',
        size: 1000,
        uploadTime: new Date(),
        objectName: 'test-object'
      });

      const original =
        '# Original Document\n\nFirst paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
      const modified = '# Original Document\n\nFirst paragraph.';
      const result = await tool({
        originalText: original,
        originalTitle: '原始文档',
        modifiedText: modified,
        modifiedTitle: '修改后文档',
        title: 'Test Report'
      });

      expect(result.htmlUrl).toBe(mockUrl);

      const uploadCall = vi.mocked(uploadFile).mock.calls[0][0];
      const htmlContent = Buffer.isBuffer(uploadCall.buffer)
        ? uploadCall.buffer.toString('utf-8')
        : Buffer.from(uploadCall.buffer || '').toString('utf-8');

      expect(htmlContent).toContain('删除');
      expect(htmlContent).toContain('Second paragraph.');
      expect(htmlContent).toContain('Third paragraph.');
    });

    it('should detect modified paragraphs', async () => {
      const mockUrl = 'https://example.com/modified-report.html';
      vi.mocked(uploadFile).mockResolvedValue({
        accessUrl: mockUrl,
        originalFilename: 'docdiff_report.html',
        contentType: 'text/html',
        size: 1000,
        uploadTime: new Date(),
        objectName: 'test-object'
      });

      const original = '# Test Document\n\nThis is the original text.';
      const modified = '# Test Document\n\nThis is the modified text.';
      const result = await tool({
        originalText: original,
        originalTitle: '原始文档',
        modifiedText: modified,
        modifiedTitle: '修改后文档',
        title: 'Test Report'
      });

      expect(result.htmlUrl).toBe(mockUrl);

      const uploadCall = vi.mocked(uploadFile).mock.calls[0][0];
      const htmlContent = Buffer.isBuffer(uploadCall.buffer)
        ? uploadCall.buffer.toString('utf-8')
        : Buffer.from(uploadCall.buffer || '').toString('utf-8');

      expect(htmlContent).toContain('修改');
      expect(htmlContent).toContain('original text');
      expect(htmlContent).toContain('modified text');
    });
  });

  describe('HTML Structure and Features', () => {
    it('should generate two-column layout HTML', async () => {
      const mockUrl = 'https://example.com/column-report.html';
      vi.mocked(uploadFile).mockResolvedValue({
        accessUrl: mockUrl,
        originalFilename: 'docdiff_report.html',
        contentType: 'text/html',
        size: 1000,
        uploadTime: new Date(),
        objectName: 'test-object'
      });

      await tool({
        originalText: '# Test\n\nContent.',
        originalTitle: '原始文档',
        modifiedText: '# Test\n\nModified content.',
        modifiedTitle: '修改后文档',
        title: 'Test Report'
      });

      const uploadCall = vi.mocked(uploadFile).mock.calls[0][0];
      const htmlContent = Buffer.isBuffer(uploadCall.buffer)
        ? uploadCall.buffer.toString('utf-8')
        : Buffer.from(uploadCall.buffer || '').toString('utf-8');

      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('📄 原始文档');
      expect(htmlContent).toContain('📝 修改后文档');
      expect(htmlContent).toContain('content-container');
      expect(htmlContent).toContain('column');
    });

    it('should include navigation controls', async () => {
      const mockUrl = 'https://example.com/nav-report.html';
      vi.mocked(uploadFile).mockResolvedValue({
        accessUrl: mockUrl,
        originalFilename: 'docdiff_report.html',
        contentType: 'text/html',
        size: 1000,
        uploadTime: new Date(),
        objectName: 'test-object'
      });

      await tool({
        originalText: '# Test\n\nContent.',
        originalTitle: '原始文档',

        modifiedText: '# Test\n\nModified content.',
        modifiedTitle: '修改后文档',

        title: 'Test Report'
      });

      const uploadCall = vi.mocked(uploadFile).mock.calls[0][0];
      const htmlContent = Buffer.isBuffer(uploadCall.buffer)
        ? uploadCall.buffer.toString('utf-8')
        : Buffer.from(uploadCall.buffer || '').toString('utf-8');

      expect(htmlContent).toContain('navigation');
      expect(htmlContent).toContain('上一处');
      expect(htmlContent).toContain('下一处');
      expect(htmlContent).toContain('previousChange');
      expect(htmlContent).toContain('nextChange');
    });

    it('should include JavaScript for navigation functionality', async () => {
      const mockUrl = 'https://example.com/js-report.html';
      vi.mocked(uploadFile).mockResolvedValue({
        accessUrl: mockUrl,
        originalFilename: 'docdiff_report.html',
        contentType: 'text/html',
        size: 1000,
        uploadTime: new Date(),
        objectName: 'test-object'
      });

      await tool({
        originalText: '# Test\n\nContent.',
        originalTitle: '原始文档',

        modifiedText: '# Test\n\nModified content.',
        modifiedTitle: '修改后文档',

        title: 'Test Report'
      });

      const uploadCall = vi.mocked(uploadFile).mock.calls[0][0];
      const htmlContent = Buffer.isBuffer(uploadCall.buffer)
        ? uploadCall.buffer.toString('utf-8')
        : Buffer.from(uploadCall.buffer || '').toString('utf-8');

      expect(htmlContent).toContain('<script>');
      expect(htmlContent).toContain('initChanges');
      expect(htmlContent).toContain('navigateToChange');
      expect(htmlContent).toContain('highlight');
      expect(htmlContent).toContain('ArrowLeft');
      expect(htmlContent).toContain('ArrowRight');
    });

    it('should include statistics in the HTML', async () => {
      const mockUrl = 'https://example.com/stats-report.html';
      vi.mocked(uploadFile).mockResolvedValue({
        accessUrl: mockUrl,
        originalFilename: 'docdiff_report.html',
        contentType: 'text/html',
        size: 1000,
        uploadTime: new Date(),
        objectName: 'test-object'
      });

      await tool({
        originalText: '# Test\n\nContent.',
        originalTitle: '原始文档',

        modifiedText: '# Test\n\nModified content.\n\nNew content.',
        modifiedTitle: '修改后文档',

        title: 'Test Report'
      });

      const uploadCall = vi.mocked(uploadFile).mock.calls[0][0];
      const htmlContent = Buffer.isBuffer(uploadCall.buffer)
        ? uploadCall.buffer.toString('utf-8')
        : Buffer.from(uploadCall.buffer || '').toString('utf-8');

      expect(htmlContent).toContain('stats');
      expect(htmlContent).toContain('新增');
      expect(htmlContent).toContain('修改');
      expect(htmlContent).toContain('删除');
    });

    it('should have responsive design styles', async () => {
      const mockUrl = 'https://example.com/responsive-report.html';
      vi.mocked(uploadFile).mockResolvedValue({
        accessUrl: mockUrl,
        originalFilename: 'docdiff_report.html',
        contentType: 'text/html',
        size: 1000,
        uploadTime: new Date(),
        objectName: 'test-object'
      });

      await tool({
        originalText: '# Test\n\nContent.',
        originalTitle: '原始文档',

        modifiedText: '# Test\n\nModified content.',
        modifiedTitle: '修改后文档',

        title: 'Test Report'
      });

      const uploadCall = vi.mocked(uploadFile).mock.calls[0][0];
      const htmlContent = Buffer.isBuffer(uploadCall.buffer)
        ? uploadCall.buffer.toString('utf-8')
        : Buffer.from(uploadCall.buffer || '').toString('utf-8');

      expect(htmlContent).toContain('@media (max-width: 768px)');
      expect(htmlContent).toContain('flex-direction: column');
    });
  });

  describe('Edge Cases', () => {
    it('should handle documents with only whitespace differences', async () => {
      const mockUrl = 'https://example.com/whitespace-report.html';
      vi.mocked(uploadFile).mockResolvedValue({
        accessUrl: mockUrl,
        originalFilename: 'docdiff_report.html',
        contentType: 'text/html',
        size: 1000,
        uploadTime: new Date(),
        objectName: 'test-object'
      });

      const original = '# Test\n\nParagraph with   multiple   spaces.\n\nNew line test.';
      const modified = '# Test\n\nParagraph with multiple spaces.\n\nNew line test.';
      const result = await tool({
        originalText: original,
        originalTitle: '原始文档',
        modifiedText: modified,
        modifiedTitle: '修改后文档',
        title: 'Test Report'
      });

      expect(result.htmlUrl).toBe(mockUrl);
    });

    it('should handle empty paragraphs in documents', async () => {
      const mockUrl = 'https://example.com/empty-paragraphs-report.html';
      vi.mocked(uploadFile).mockResolvedValue({
        accessUrl: mockUrl,
        originalFilename: 'docdiff_report.html',
        contentType: 'text/html',
        size: 1000,
        uploadTime: new Date(),
        objectName: 'test-object'
      });

      const original = '# Test\n\n\nParagraph after empty line.';
      const modified = '# Test\n\n\n\nParagraph after empty lines.';
      const result = await tool({
        originalText: original,
        originalTitle: '原始文档',
        modifiedText: modified,
        modifiedTitle: '修改后文档',
        title: 'Test Report'
      });

      expect(result.htmlUrl).toBe(mockUrl);
    });

    it('should handle very long paragraphs', async () => {
      const mockUrl = 'https://example.com/long-paragraphs-report.html';
      vi.mocked(uploadFile).mockResolvedValue({
        accessUrl: mockUrl,
        originalFilename: 'docdiff_report.html',
        contentType: 'text/html',
        size: 1000,
        uploadTime: new Date(),
        objectName: 'test-object'
      });

      const longText = 'A'.repeat(1000);
      const original = `# Test\n\n${longText}`;
      const modified = `# Test\n\n${longText} modified`;
      const result = await tool({
        originalText: original,
        originalTitle: '原始文档',
        modifiedText: modified,
        modifiedTitle: '修改后文档',
        title: 'Test Report'
      });

      expect(result.htmlUrl).toBe(mockUrl);
    });
  });
});
