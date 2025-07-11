import { z } from 'zod';
import axios from 'axios';
import { uploadFile } from '@tool/utils/uploadFile';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle
} from 'docx';

export const InputType = z.object({
  markdown: z.string().describe('Markdown content to convert')
});

export const OutputType = z.object({
  downloadUrl: z.string().describe('URL to download the converted file')
});

function createTextRun(
  text: string,
  options: { bold?: boolean; italics?: boolean; color?: string; size?: number } = {}
): TextRun {
  return new TextRun({
    text,
    bold: options.bold,
    italics: options.italics,
    color: options.color,
    size: options.size && !isNaN(options.size) ? options.size : undefined
  });
}

function getImageDimensions(buffer: Buffer): { width: number; height: number } {
  try {
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      let i = 2;
      while (i < buffer.length) {
        if (buffer[i] === 0xff) {
          const marker = buffer[i + 1];
          if (marker === 0xc0 || marker === 0xc2) {
            const height = buffer.readUInt16BE(i + 5);
            const width = buffer.readUInt16BE(i + 7);
            return { width, height };
          }
          i += 2 + buffer.readUInt16BE(i + 2);
        } else {
          i++;
        }
      }
    }

    if (
      buffer.toString('ascii', 0, 6) === 'GIF87a' ||
      buffer.toString('ascii', 0, 6) === 'GIF89a'
    ) {
      const width = buffer.readUInt16LE(6);
      const height = buffer.readUInt16LE(8);
      return { width, height };
    }

    if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
      const width = buffer.readUInt32LE(18);
      const height = buffer.readUInt32LE(22);
      return { width, height };
    }

    return { width: 400, height: 300 };
  } catch (error) {
    console.warn('无法获取图片尺寸，使用默认尺寸', error);
    return { width: 400, height: 300 };
  }
}

function calculateDisplaySize(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number = 600
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  if (originalWidth <= maxWidth) {
    return { width: originalWidth, height: originalHeight };
  } else {
    const width = maxWidth;
    const height = Math.round(width / aspectRatio);
    return { width, height };
  }
}

async function processImageFromText(text: string): Promise<Paragraph | null> {
  const imageMatch = text.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  if (!imageMatch) return null;

  const [, alt, src] = imageMatch;

  try {
    const response = await axios.get(src, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);

    const originalDimensions = getImageDimensions(imageBuffer);

    const displaySize = calculateDisplaySize(originalDimensions.width, originalDimensions.height);

    const getImageType = (url: string): 'jpg' | 'png' | 'gif' | 'bmp' => {
      const extension = url.toLowerCase().split('.').pop();
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          return 'jpg';
        case 'gif':
          return 'gif';
        case 'bmp':
          return 'bmp';
        case 'png':
        default:
          return 'png';
      }
    };

    return new Paragraph({
      children: [
        new ImageRun({
          data: imageBuffer,
          transformation: {
            width: displaySize.width,
            height: displaySize.height
          },
          type: getImageType(src)
        })
      ],
      spacing: { after: 200 }
    });
  } catch (error) {
    console.warn(`图片加载失败: ${src}`, error);
    return new Paragraph({
      children: [createTextRun(`[图片: ${alt || src}]`, { italics: true, color: '666666' })],
      spacing: { after: 200 }
    });
  }
}

function parseMarkdownTable(tableText: string): string[][] {
  const lines = tableText.trim().split('\n');
  const rows: string[][] = [];

  for (const line of lines) {
    if (line.includes('---')) continue;

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

    if (cells.length > 0) {
      if (rows.length === 0) {
        rows.push(cells);
      } else {
        const headerLength = rows[0].length;
        while (cells.length < headerLength) {
          cells.push('');
        }
        rows.push(cells);
      }
    }
  }

  return rows;
}

function parseInline(content: string): TextRun[] {
  const runs: TextRun[] = [];
  const regex = /(\*\*.+?\*\*|\*.+?\*|[^*]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const part = match[1];
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(createTextRun(part.slice(2, -2), { bold: true }));
    } else if (part.startsWith('*') && part.endsWith('*')) {
      runs.push(createTextRun(part.slice(1, -1), { italics: true }));
    } else if (part.trim()) {
      runs.push(createTextRun(part));
    }
  }
  return runs;
}

async function createTableCell(content: string): Promise<TableCell> {
  const imageParagraph = await processImageFromText(content);
  if (imageParagraph) {
    return new TableCell({
      children: [imageParagraph],
      width: {
        size: 3000,
        type: WidthType.DXA
      }
    });
  }

  return new TableCell({
    children: [
      new Paragraph({
        children: parseInline(content),
        spacing: { after: 0 }
      })
    ],
    width: {
      size: 3000,
      type: WidthType.DXA
    }
  });
}

async function createTable(tableData: string[][]): Promise<Table> {
  const rows: TableRow[] = [];

  if (tableData.length > 0) {
    const headerCells = await Promise.all(
      tableData[0].map(
        async (header) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [createTextRun(header, { bold: true })],
                spacing: { after: 0 }
              })
            ],
            width: {
              size: 3000,
              type: WidthType.DXA
            }
          })
      )
    );
    rows.push(new TableRow({ children: headerCells }));
  }

  for (let i = 1; i < tableData.length; i++) {
    const cells = await Promise.all(tableData[i].map((content) => createTableCell(content)));
    rows.push(new TableRow({ children: cells }));
  }

  return new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
    }
  });
}

async function parseMarkdownToParagraphs(markdown: string): Promise<(Paragraph | Table)[]> {
  const elements: (Paragraph | Table)[] = [];

  const blocks = markdown.split(/\n\s*\n/);
  for (const block of blocks) {
    if (block.includes('|') && block.includes('---')) {
      const table = await createTable(parseMarkdownTable(block));
      elements.push(table);
      continue;
    }

    const lines = block.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        const imageParagraph = await processImageFromText(line);
        if (imageParagraph) {
          elements.push(imageParagraph);
        } else {
          const runs = parseInline(line);
          if (runs.length > 0) {
            elements.push(
              new Paragraph({
                children: runs,
                spacing: { after: 100 }
              })
            );
          }
        }
      }
    }
  }

  return elements;
}

export async function tool({
  markdown
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    const elements = await parseMarkdownToParagraphs(markdown);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: elements
        }
      ]
    });

    const docBuffer = await Packer.toBuffer(doc);
    const buffer = Buffer.from(docBuffer);
    const base64Data = buffer.toString('base64');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `markdown-to-docx-${timestamp}.docx`;

    const result = await uploadFile({
      base64: base64Data,
      defaultFilename: filename
    });

    if (!result) {
      throw new Error('Upload failed: No result returned');
    }

    if (!result.accessUrl) {
      throw new Error('Upload failed: No access URL in result');
    }

    return { downloadUrl: result.accessUrl };
  } catch (error: any) {
    console.error('Error details:', error);
    const errorMessage = error?.message || String(error) || 'Unknown error occurred';
    throw new Error(`Failed to process document: ${errorMessage}`);
  }
}
