import { z } from 'zod';
import * as Minio from 'minio';
import MarkdownIt from 'markdown-it';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from 'docx';
import * as XLSX from 'xlsx';
import { defaultFileConfig } from '@/s3/config';

export const InputType = z.object({
  markdown: z.string().describe('Markdown content to convert'),
  format: z.enum(['docx', 'doc', 'xlsx']).describe('Output format')
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
    size: options.size
  });
}

function parseMarkdownTable(tableText: string): string[][] {
  const lines = tableText.trim().split('\n');
  const rows: string[][] = [];

  for (const line of lines) {
    if (line.includes('---')) continue;

    const cells = line
      .split('|')
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return rows;
}

function parseMarkdownToParagraphs(markdown: string): (Paragraph | Table)[] {
  const md = new MarkdownIt();
  const tokens = md.parse(markdown, {});
  const elements: (Paragraph | Table)[] = [];

  const parseInline = (content: string): TextRun[] => {
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
  };

  const hasTable = markdown.includes('|') && markdown.includes('---');

  if (hasTable) {
    const sections = markdown.split(/\n\s*\n/);

    for (const section of sections) {
      if (section.includes('|') && section.includes('---')) {
        const tableData = parseMarkdownTable(section);

        if (tableData.length > 0) {
          const tableRows = tableData.map(
            (rowData) =>
              new TableRow({
                children: rowData.map(
                  (cellData) =>
                    new TableCell({
                      children: [new Paragraph({ children: [createTextRun(cellData)] })],
                      width: { size: 2000, type: WidthType.DXA }
                    })
                )
              })
          );

          const table = new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
          });

          elements.push(table);
        }
      } else {
        const lines = section.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            if (line.startsWith('#')) {
              const level = (line.match(/^#+/) || [''])[0].length;
              const content = line.replace(/^#+\s*/, '');

              const color = '007ACC';
              const sizes = [28, 24, 20];
              const size = sizes[Math.min(level - 1, 2)] * 2;

              const runs = [createTextRun(content, { bold: true, color, size })];
              elements.push(new Paragraph({ children: runs, spacing: { after: 200 } }));
            } else if (line.startsWith('- ') || line.startsWith('* ')) {
              // list item
              const content = line.replace(/^[-*]\s*/, '');
              const runs = parseInline(content);
              elements.push(new Paragraph({ bullet: { level: 0 }, children: runs }));
            } else {
              // paragraph
              const runs = parseInline(line);
              if (runs.length > 0) {
                elements.push(
                  new Paragraph({
                    children: runs,
                    spacing: { after: 100 },
                    indent: { firstLine: 720 }
                  })
                );
              }
            }
          }
        }
      }
    }

    return elements;
  }

  if (
    tokens.length === 0 ||
    !tokens.some((t) => t.type === 'paragraph_open' || t.type === 'heading_open')
  ) {
    const lines = markdown.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        const runs = parseInline(line);
        if (runs.length > 0) {
          elements.push(
            new Paragraph({
              children: runs,
              spacing: { after: 100 },
              indent: { firstLine: 360 }
            })
          );
        }
      }
    }
    return elements;
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    // heading
    if (t.type === 'heading_open') {
      const level = Number(t.tag[1]);
      const content = tokens[i + 1].content;

      const color = '007ACC';
      const sizes = [28, 24, 20];
      const size = sizes[level - 1] * 2;

      const runs = [
        new TextRun({
          text: content,
          bold: true,
          color: color,
          size: size
        })
      ];

      elements.push(new Paragraph({ children: runs, spacing: { after: 200 } }));
      i += 2;
      continue;
    }

    // list
    if (t.type === 'bullet_list_open') {
      i++;
      while (tokens[i] && tokens[i].type !== 'bullet_list_close') {
        if (tokens[i].type === 'list_item_open') {
          const content = tokens[i + 2]?.content || '';
          const runs = parseInline(content);
          elements.push(new Paragraph({ bullet: { level: 0 }, children: runs }));
          i += 4;
        } else {
          i++;
        }
      }
      continue;
    }

    // paragraph
    if (t.type === 'paragraph_open') {
      const content = tokens[i + 1].content;
      const runs = parseInline(content);
      if (runs.length > 0) {
        elements.push(
          new Paragraph({
            children: runs,
            spacing: { after: 100 },
            indent: { firstLine: 720 }
          })
        );
      }
      i += 2;
      continue;
    }
  }

  return elements;
}

function parseMarkdownToExcelData(markdown: string): any[][] {
  if (markdown.includes('|') && markdown.includes('---')) {
    const sections = markdown.split(/\n\s*\n/);
    const allRows: any[][] = [];

    for (const section of sections) {
      if (section.includes('|') && section.includes('---')) {
        const tableData = parseMarkdownTable(section);
        allRows.push(...tableData);
        allRows.push([]);
      } else {
        const lines = section.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            const cleanText = line
              .replace(/#{1,6}\s*/g, '')
              .replace(/\*\*(.*?)\*\*/g, '$1')
              .replace(/\*(.*?)\*/g, '$1')
              .replace(/^[-*]\s*/gm, '')
              .trim();
            if (cleanText) {
              allRows.push([cleanText]);
            }
          }
        }
      }
    }

    return allRows;
  }

  const md = new MarkdownIt();
  const tokens = md.parse(markdown, {});
  const rows: any[][] = [];

  const extractText = (content: string): string => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s*/g, '')
      .replace(/^[-*]\s*/gm, '')
      .trim();
  };

  if (
    tokens.length === 0 ||
    !tokens.some((t) => t.type === 'paragraph_open' || t.type === 'heading_open')
  ) {
    const lines = markdown.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        rows.push([extractText(line)]);
      }
    }
    return rows;
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t.type === 'heading_open') {
      const content = tokens[i + 1].content;
      rows.push([extractText(content)]);
      i += 2;
      continue;
    }

    if (t.type === 'bullet_list_open') {
      i++;
      while (tokens[i] && tokens[i].type !== 'bullet_list_close') {
        if (tokens[i].type === 'list_item_open') {
          const content = tokens[i + 2]?.content || '';
          rows.push([extractText(content)]);
          i += 4;
        } else {
          i++;
        }
      }
      continue;
    }

    if (t.type === 'paragraph_open') {
      const content = tokens[i + 1].content;
      if (content.trim()) {
        rows.push([extractText(content)]);
      }
      i += 2;
      continue;
    }
  }

  return rows;
}

async function createWordDocument(markdown: string): Promise<Buffer> {
  const elements = parseMarkdownToParagraphs(markdown);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: elements
      }
    ]
  });

  return await Packer.toBuffer(doc);
}

async function createExcelDocument(markdown: string): Promise<Buffer> {
  const data = parseMarkdownToExcelData(markdown);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Markdown Content');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return buffer;
}

function getContentType(format: string): string {
  switch (format) {
    case 'doc':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
}

export async function tool({
  markdown,
  format
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    let buffer: Buffer;

    switch (format) {
      case 'doc':
        buffer = await createWordDocument(markdown);
        break;
      case 'xlsx':
        buffer = await createExcelDocument(markdown);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    const minioClient = new Minio.Client({
      endPoint: defaultFileConfig.endpoint,
      port: defaultFileConfig.port,
      useSSL: defaultFileConfig.useSSL,
      accessKey: defaultFileConfig.accessKey,
      secretKey: defaultFileConfig.secretKey
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const objectName = `markdown-to-${format}-${timestamp}.${format}`;

    await minioClient.putObject(defaultFileConfig.bucket, objectName, buffer, buffer.length, {
      'Content-Type': getContentType(format)
    });

    const downloadUrl = await minioClient.presignedGetObject(
      defaultFileConfig.bucket,
      objectName,
      7 * 24 * 60 * 60
    );

    return { downloadUrl };
  } catch (error: any) {
    throw new Error(`Failed to process document: ${error.message}`);
  }
}
