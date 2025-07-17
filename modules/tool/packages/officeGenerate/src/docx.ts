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
  HeadingLevel as HeadingLevelEnum,
  TableCell,
  WidthType
} from 'docx';
import MarkdownIt from 'markdown-it';

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

function getHeadingLevel(level: number): (typeof HeadingLevelEnum)[keyof typeof HeadingLevelEnum] {
  switch (level) {
    case 1:
      return HeadingLevelEnum.HEADING_1;
    case 2:
      return HeadingLevelEnum.HEADING_2;
    case 3:
      return HeadingLevelEnum.HEADING_3;
    case 4:
      return HeadingLevelEnum.HEADING_4;
    case 5:
      return HeadingLevelEnum.HEADING_5;
    case 6:
      return HeadingLevelEnum.HEADING_6;
    default:
      return HeadingLevelEnum.HEADING_1;
  }
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
    console.warn('getImageDimensions error', error);
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
    console.warn(`processImageFromText error: ${src}`, error);
    return new Paragraph({
      children: [createTextRun(`[images: ${alt || src}]`, { italics: true, color: '666666' })],
      spacing: { after: 200 }
    });
  }
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

async function parseTableTokens(
  tokens: any[],
  startIndex: number
): Promise<{ table: Table; nextIndex: number }> {
  const rows: TableRow[] = [];
  let i = startIndex + 1;

  while (i < tokens.length && tokens[i].type !== 'table_close') {
    if (tokens[i].type === 'tr_open') {
      const cells: TableCell[] = [];
      i++;
      while (i < tokens.length && tokens[i].type !== 'tr_close') {
        if (tokens[i].type === 'td_open' || tokens[i].type === 'th_open') {
          i++;
          let cellText = '';
          while (
            i < tokens.length &&
            tokens[i].type !== 'td_close' &&
            tokens[i].type !== 'th_close'
          ) {
            if (tokens[i].type === 'inline') {
              cellText += tokens[i].content;
            }
            i++;
          }
          const cellParagraph = new Paragraph({
            children: parseInline(cellText)
          });
          const cell = new TableCell({
            children: [cellParagraph]
          });
          cells.push(cell);
          i++; // skip td_close or th_close
        } else {
          i++;
        }
      }
      rows.push(new TableRow({ children: cells }));
      i++; // skip tr_close
    } else {
      i++;
    }
  }

  const table = new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    }
  });

  return { table, nextIndex: i };
}

async function parseMarkdownToParagraphs(markdown: string): Promise<(Paragraph | Table)[]> {
  const md = new MarkdownIt();
  const tokens = md.parse(markdown, {});
  const elements: (Paragraph | Table)[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'heading_open') {
      const level = Number(token.tag.slice(1)); // h1 -> 1
      const inlineToken = tokens[i + 1];
      let children: TextRun[] = [];

      if (inlineToken?.type === 'inline' && inlineToken.children) {
        const childTokens = inlineToken.children;
        for (let j = 0; j < childTokens.length; j++) {
          const inline = childTokens[j];
          if (inline.type === 'text') {
            children.push(...parseInline(inline.content));
          } else if (inline.type === 'strong_open') {
            const next = childTokens[j + 1];
            if (next?.type === 'text') {
              children.push(createTextRun(next.content, { bold: true }));
              j++;
            }
          } else if (inline.type === 'em_open') {
            const next = childTokens[j + 1];
            if (next?.type === 'text') {
              children.push(createTextRun(next.content, { italics: true }));
              j++;
            }
          } else if (inline.type === 'image') {
            if (children.length > 0) {
              elements.push(new Paragraph({ children, spacing: { after: 100 } }));
              children = [];
            }
            const alt = inline.attrGet('alt') || '';
            const src = inline.attrGet('src');
            if (src) {
              const imageMarkdown = `![${alt}](${src})`;
              const imageParagraph = await processImageFromText(imageMarkdown);
              if (imageParagraph) elements.push(imageParagraph);
            }
          }
        }
      }

      if (children.length > 0) {
        elements.push(
          new Paragraph({
            children,
            heading: getHeadingLevel(level),
            spacing: { after: 200 }
          })
        );
      }

      i += 2;
      continue;
    }

    if (token.type === 'paragraph_open') {
      const children: TextRun[] = [];
      const imageMarkdowns: string[] = [];

      const inlineToken = tokens[i + 1];
      if (inlineToken?.type === 'inline' && inlineToken.children) {
        const childTokens = inlineToken.children;
        for (let j = 0; j < childTokens.length; j++) {
          const inline = childTokens[j];

          if (inline.type === 'text') {
            children.push(...parseInline(inline.content));
          } else if (inline.type === 'strong_open') {
            const next = childTokens[j + 1];
            if (next?.type === 'text') {
              children.push(createTextRun(next.content, { bold: true }));
              j++; // skip next
            }
          } else if (inline.type === 'em_open') {
            const next = childTokens[j + 1];
            if (next?.type === 'text') {
              children.push(createTextRun(next.content, { italics: true }));
              j++;
            }
          } else if (inline.type === 'image') {
            const alt = inline.attrGet('alt') || '';
            const src = inline.attrGet('src');
            if (src) {
              imageMarkdowns.push(`![${alt}](${src})`);
            }
          }
        }
      }

      if (children.length > 0) {
        elements.push(new Paragraph({ children, spacing: { after: 100 } }));
      }

      for (const imgMd of imageMarkdowns) {
        const imageParagraph = await processImageFromText(imgMd);
        if (imageParagraph) {
          elements.push(imageParagraph);
        }
      }

      i += 2; // skip inline and paragraph_close
      continue;
    }

    if (token.type === 'table_open') {
      const { table, nextIndex } = await parseTableTokens(tokens, i);
      elements.push(table);
      i = nextIndex;
      continue;
    }

    if (token.type === 'inline' && token.children) {
      for (const child of token.children) {
        if (child.type === 'image') {
          const imageMarkdown = `![${child.attrGet('alt') || ''}](${child.attrGet('src')})`;
          const imageParagraph = await processImageFromText(imageMarkdown);
          if (imageParagraph) elements.push(imageParagraph);
        }
      }
    }
  }

  return elements;
}

export async function docxTool({
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
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `markdown-to-docx-${timestamp}.docx`;
    const buf = Buffer.from(docBuffer);
    const result = await uploadFile({
      buffer: buf,
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
