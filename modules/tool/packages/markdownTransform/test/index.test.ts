import { expect, test, describe, vi, beforeEach } from 'vitest';
import tool from '..';
import * as uploadFileModule from '@tool/utils/uploadFile';

// Mock the uploadFile function
vi.mock('@tool/utils/uploadFile', () => ({
  uploadFile: vi.fn()
}));

// Mock axios for image downloads
vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  }
}));

const mockUploadFile = vi.mocked(uploadFileModule.uploadFile);

// Get the axios mock with proper typing
const getAxiosMock = async () => {
  const axios = await import('axios');
  return vi.mocked(axios.default.get);
};

beforeEach(async () => {
  // Reset mocks before each test
  vi.clearAllMocks();

  // Default mock implementation
  mockUploadFile.mockResolvedValue({
    accessUrl: 'https://example.com/test-file.docx'
  } as any);

  // Default axios mock implementation
  const axiosMock = await getAxiosMock();
  axiosMock.mockResolvedValue({
    data: Buffer.from('fake-image-data')
  } as any);
});

describe('markdownTransform tool', () => {
  test('should have required properties', () => {
    expect(tool.name).toBeDefined();
    expect(tool.description).toBeDefined();
    expect(tool.cb).toBeDefined();
  });

  describe('docx conversion', () => {
    test('should convert simple markdown to docx', async () => {
      const result = await tool.cb(
        {
          format: 'docx',
          markdown: '# Hello World\n\nThis is a test paragraph.'
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
      expect(mockUploadFile).toHaveBeenCalledOnce();

      const uploadCall = mockUploadFile.mock.calls[0][0];
      expect(uploadCall.defaultFilename).toBe('markdown-to-docx.docx');
      expect(uploadCall.buffer).toBeInstanceOf(Buffer);
    });

    test('should handle markdown with headers', async () => {
      const markdown = `# Title 1
## Title 2  
### Title 3

Normal paragraph text.`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });

    test('should handle markdown with formatting', async () => {
      const markdown = `# Test Document

This is **bold text** and this is *italic text*.

- List item 1
- List item 2
- List item 3

> This is a blockquote.`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });

    test('should handle markdown with tables', async () => {
      const markdown = `# Document with Table

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });

    test('should handle empty markdown', async () => {
      const result = await tool.cb(
        {
          format: 'docx',
          markdown: ''
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });
  });

  describe('xlsx conversion', () => {
    test('should convert simple markdown to xlsx', async () => {
      mockUploadFile.mockResolvedValue({
        accessUrl: 'https://example.com/test-file.xlsx'
      } as any);

      const result = await tool.cb(
        {
          format: 'xlsx',
          markdown: '# Hello World\n\nThis is a test paragraph.'
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.xlsx');
      expect(mockUploadFile).toHaveBeenCalledOnce();

      const uploadCall = mockUploadFile.mock.calls[0][0];
      expect(uploadCall.defaultFilename).toBe('markdown-to-excel.xlsx');
      expect(uploadCall.buffer).toBeInstanceOf(Buffer);
    });

    test('should handle markdown with tables in xlsx', async () => {
      mockUploadFile.mockResolvedValue({
        accessUrl: 'https://example.com/test-table.xlsx'
      } as any);

      const markdown = `# Spreadsheet Data

| Product | Price | Stock |
|---------|-------|-------|
| Apple   | $1.20 | 100   |
| Orange  | $0.80 | 150   |
| Banana  | $0.50 | 200   |`;

      const result = await tool.cb(
        {
          format: 'xlsx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-table.xlsx');
    });

    test('should handle markdown with mixed content in xlsx', async () => {
      mockUploadFile.mockResolvedValue({
        accessUrl: 'https://example.com/test-mixed.xlsx'
      } as any);

      const markdown = `# Report Title

## Summary
This is a summary paragraph.

## Data Table
| Metric | Q1 | Q2 | Q3 | Q4 |
|--------|----|----|----|----|
| Sales  | 100| 120| 110| 130|
| Profit | 20 | 25 | 22 | 28 |

## Conclusion
Final remarks here.`;

      const result = await tool.cb(
        {
          format: 'xlsx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-mixed.xlsx');
    });
  });

  describe('error handling', () => {
    test('should handle invalid format', async () => {
      const result = await tool.cb(
        {
          format: 'pdf' as any,
          markdown: '# Test'
        },
        {} as any
      );

      expect(result.error).toBeDefined();
      expect(result.output).toBeUndefined();
    });

    test('should handle upload failure', async () => {
      mockUploadFile.mockRejectedValue(new Error('Upload failed'));

      const result = await tool.cb(
        {
          format: 'docx',
          markdown: '# Test'
        },
        {} as any
      );

      expect(result.error).toBeDefined();
      expect(result.output).toBeUndefined();
    });

    test('should handle missing accessUrl in upload result', async () => {
      mockUploadFile.mockResolvedValue({
        accessUrl: undefined
      } as any);

      const result = await tool.cb(
        {
          format: 'docx',
          markdown: '# Test'
        },
        {} as any
      );

      expect(result.error).toBeDefined();
      expect(result.output).toBeUndefined();
    });

    test('should handle malformed markdown gracefully', async () => {
      const malformedMarkdown = `# Title
      
![Image with no closing bracket(invalid-url
      
| Table | with | missing |
| cells |
      
**Unclosed bold text`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown: malformedMarkdown
        },
        {} as any
      );

      // Should still succeed but handle malformed content gracefully
      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });
  });

  describe('image processing', () => {
    test('should handle markdown with images in docx', async () => {
      const markdown = `# Document with Image

Here is an image:
![Test Image](https://example.com/test.png)

Some text after the image.`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });

    test('should handle image download failure gracefully', async () => {
      const axiosMock = await getAxiosMock();
      axiosMock.mockRejectedValue(new Error('Network error'));

      const markdown = `# Document with Broken Image

![Broken Image](https://example.com/broken.png)`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });

    test('should handle different image formats (PNG, JPEG, GIF, BMP)', async () => {
      const axiosMock = await getAxiosMock();

      // Mock PNG image data
      const pngBuffer = Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
        0x00,
        0x00,
        0x00,
        0x0d,
        0x49,
        0x48,
        0x44,
        0x52,
        0x00,
        0x00,
        0x01,
        0x90, // width: 400
        0x00,
        0x00,
        0x01,
        0x2c // height: 300
      ]);

      axiosMock.mockResolvedValue({ data: pngBuffer } as any);

      const markdown = `# Images Test

![PNG Image](https://example.com/test.png)
![JPEG Image](https://example.com/test.jpg)
![GIF Image](https://example.com/test.gif)
![BMP Image](https://example.com/test.bmp)`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });

    test('should handle images with different buffer formats', async () => {
      const axiosMock = await getAxiosMock();

      // Test JPEG buffer
      const jpegBuffer = Buffer.from([
        0xff,
        0xd8, // JPEG header
        0xff,
        0xc0,
        0x00,
        0x11,
        0x08,
        0x01,
        0x2c, // height: 300
        0x01,
        0x90 // width: 400
      ]);

      axiosMock.mockResolvedValue({ data: jpegBuffer } as any);

      const markdown = `![JPEG Test](https://example.com/test.jpeg)`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });

    test('should handle GIF buffer format', async () => {
      const axiosMock = await getAxiosMock();

      // Test GIF buffer
      const gifBuffer = Buffer.from('GIF89a\x90\x01\x2c\x01', 'binary');

      axiosMock.mockResolvedValue({ data: gifBuffer } as any);

      const markdown = `![GIF Test](https://example.com/test.gif)`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });

    test('should handle BMP buffer format', async () => {
      const axiosMock = await getAxiosMock();

      // Test BMP buffer
      const bmpBuffer = Buffer.alloc(30);
      bmpBuffer[0] = 0x42; // 'B'
      bmpBuffer[1] = 0x4d; // 'M'
      bmpBuffer.writeUInt32LE(400, 18); // width
      bmpBuffer.writeUInt32LE(300, 22); // height

      axiosMock.mockResolvedValue({ data: bmpBuffer } as any);

      const markdown = `![BMP Test](https://example.com/test.bmp)`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });

    test('should handle invalid image buffer gracefully', async () => {
      const axiosMock = await getAxiosMock();

      // Invalid buffer that doesn't match any format
      const invalidBuffer = Buffer.from('invalid image data');

      axiosMock.mockResolvedValue({ data: invalidBuffer } as any);

      const markdown = `![Invalid Image](https://example.com/invalid.png)`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });
  });

  describe('complex markdown parsing', () => {
    test('should handle inline formatting within headers', async () => {
      const markdown = `# **Bold Title** with *italic*

## Another **bold** and *italic* header

Normal paragraph with **bold** and *italic* text.`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });

    test('should handle images within headers', async () => {
      const markdown = `# Title with ![inline image](https://example.com/header.png)

Normal content here.`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });

    test('should handle mixed inline elements', async () => {
      const markdown = `# Complex Header

This paragraph has **bold text**, *italic text*, and ![image](https://example.com/inline.png) all together.

Another paragraph with different formatting.`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });

    test('should handle all heading levels', async () => {
      const markdown = `# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
####### Should default to Heading 1`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });

    test('should handle complex table structures', async () => {
      const markdown = `# Complex Table

| **Header 1** | *Header 2* | Header 3 |
|--------------|------------|----------|
| **Bold cell** | *Italic* | Normal |
| ![img](https://example.com/cell.png) | Mixed content | Last |
| Empty | | Cell |`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });
  });

  describe('xlsx specific features', () => {
    test('should handle images in xlsx tables', async () => {
      mockUploadFile.mockResolvedValue({
        accessUrl: 'https://example.com/test-table-images.xlsx'
      } as any);

      const markdown = `# Data with Images

| Product | Image | Price |
|---------|-------|-------|
| Apple | ![apple](https://example.com/apple.png) | $1.20 |
| Orange | ![orange](https://example.com/orange.png) | $0.80 |`;

      const result = await tool.cb(
        {
          format: 'xlsx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-table-images.xlsx');
    });

    test('should handle mixed content blocks in xlsx', async () => {
      mockUploadFile.mockResolvedValue({
        accessUrl: 'https://example.com/mixed-blocks.xlsx'
      } as any);

      const markdown = `# Title

Regular paragraph.

| Table | Data |
|-------|------|
| A | B |

Another paragraph.

![Image](https://example.com/standalone.png)

Final paragraph.`;

      const result = await tool.cb(
        {
          format: 'xlsx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/mixed-blocks.xlsx');
    });

    test('should handle tables with varying column counts', async () => {
      mockUploadFile.mockResolvedValue({
        accessUrl: 'https://example.com/varying-columns.xlsx'
      } as any);

      const markdown = `# Irregular Table

| Col1 | Col2 | Col3 |
|------|------|------|
| A | B | C |
| D | E |
| F |`;

      const result = await tool.cb(
        {
          format: 'xlsx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/varying-columns.xlsx');
    });

    test('should handle image failures in xlsx cells', async () => {
      const axiosMock = await getAxiosMock();
      axiosMock.mockRejectedValue(new Error('Image download failed'));

      mockUploadFile.mockResolvedValue({
        accessUrl: 'https://example.com/failed-images.xlsx'
      } as any);

      const markdown = `| Product | Image |
|---------|-------|
| Test | ![broken](https://example.com/broken.png) |`;

      const result = await tool.cb(
        {
          format: 'xlsx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/failed-images.xlsx');
    });
  });

  describe('edge cases and error paths', () => {
    test('should handle markdown with only whitespace', async () => {
      const result = await tool.cb(
        {
          format: 'docx',
          markdown: '   \n\n  \t  \n   '
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });

    test('should handle markdown with multiple consecutive line breaks', async () => {
      const markdown = `# Title


Multiple line breaks



Should be handled gracefully.


`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });

    test('should handle tables without proper separators', async () => {
      const markdown = `# Table Test

| Col1 | Col2 |
| Data1 | Data2 |`;

      const result = await tool.cb(
        {
          format: 'xlsx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });

    test('should handle large image size calculations', async () => {
      const axiosMock = await getAxiosMock();

      // Large image buffer
      const largeImageBuffer = Buffer.alloc(100);
      largeImageBuffer[0] = 0x89;
      largeImageBuffer[1] = 0x50;
      largeImageBuffer[2] = 0x4e;
      largeImageBuffer[3] = 0x47;
      largeImageBuffer.writeUInt32BE(2000, 16); // Large width
      largeImageBuffer.writeUInt32BE(1500, 20); // Large height

      axiosMock.mockResolvedValue({ data: largeImageBuffer } as any);

      const markdown = `![Large Image](https://example.com/large.png)`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });

    test('should handle corrupted image buffer', async () => {
      const axiosMock = await getAxiosMock();

      // Buffer that throws error during processing
      const corruptBuffer = Buffer.alloc(10);
      Object.defineProperty(corruptBuffer, 'readUInt32BE', {
        value: () => {
          throw new Error('Corrupt buffer');
        }
      });

      axiosMock.mockResolvedValue({ data: corruptBuffer } as any);

      const markdown = `![Corrupt Image](https://example.com/corrupt.png)`;

      const result = await tool.cb(
        {
          format: 'docx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });

    test('should handle very long text content', async () => {
      const longText = 'A'.repeat(10000);
      const markdown = `# Long Content Test

${longText}

Another paragraph with normal length.`;

      const result = await tool.cb(
        {
          format: 'xlsx',
          markdown
        },
        {} as any
      );

      expect(result.error).toBeUndefined();
      expect(result.output?.url).toBe('https://example.com/test-file.docx');
    });
  });

  describe('input validation', () => {
    test('should validate required format field', async () => {
      const result = await tool.cb(
        {
          markdown: '# Test'
          // missing format
        } as any,
        {} as any
      );

      expect(result.error).toBeDefined();
      expect(result.output).toBeUndefined();
    });

    test('should validate required markdown field', async () => {
      const result = await tool.cb(
        {
          format: 'docx'
          // missing markdown
        } as any,
        {} as any
      );

      expect(result.error).toBeDefined();
      expect(result.output).toBeUndefined();
    });

    test('should validate format enum values', async () => {
      const result = await tool.cb(
        {
          format: 'invalid-format',
          markdown: '# Test'
        } as any,
        {} as any
      );

      expect(result.error).toBeDefined();
      expect(result.output).toBeUndefined();
    });

    test('should validate markdown is string', async () => {
      const result = await tool.cb(
        {
          format: 'docx',
          markdown: 123
        } as any,
        {} as any
      );

      expect(result.error).toBeDefined();
      expect(result.output).toBeUndefined();
    });
  });
});
