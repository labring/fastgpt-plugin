import { z } from 'zod';
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
  WidthType,
  BorderStyle
} from 'docx';
import MarkdownIt from 'markdown-it';
import { OutputType } from './type';
import {
  downloadImage,
  getImageDimensions,
  getImageExtension,
  calculateDisplaySize
} from './shared';

export const InputType = z.object({
  markdown: z.string().describe('Markdown content to convert'),
  filename: z.string().optional().describe('Custom filename without extension')
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

async function processImageFromText(text: string): Promise<Paragraph | null> {
  const imageMatch = text.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  if (!imageMatch) return null;

  const [, alt, src] = imageMatch;

  try {
    const imageBuffer = await downloadImage(src);
    const originalDimensions = getImageDimensions(imageBuffer);
    const displaySize = calculateDisplaySize(originalDimensions.width, originalDimensions.height);

    return new Paragraph({
      children: [
        new ImageRun({
          data: imageBuffer,
          transformation: {
            width: displaySize.width,
            height: displaySize.height
          },
          type: getImageExtension(src)
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
  const regex = /(\*\*.+?\*\*|\*.+?\*|\[.+?\]\(.+?\)|[^*[\]]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const part = match[1];
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(createTextRun(part.slice(2, -2), { bold: true }));
    } else if (part.startsWith('*') && part.endsWith('*')) {
      runs.push(createTextRun(part.slice(1, -1), { italics: true }));
    } else if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      runs.push(createTextRun(part));
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

  interface ListState {
    type: 'ordered' | 'bullet';
    order: number;
  }
  const listStack: ListState[] = [];
  let isListItemStart = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'ordered_list_open') {
      listStack.push({ type: 'ordered', order: 0 });
      continue;
    }
    if (token.type === 'bullet_list_open') {
      listStack.push({ type: 'bullet', order: 0 });
      continue;
    }
    if (token.type === 'ordered_list_close' || token.type === 'bullet_list_close') {
      listStack.pop();
      continue;
    }
    if (token.type === 'list_item_open') {
      if (listStack.length > 0) {
        listStack[listStack.length - 1].order++;
      }
      isListItemStart = true;
      continue;
    }
    if (token.type === 'list_item_close') {
      isListItemStart = false;
      continue;
    }

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
          } else if (inline.type === 'code_inline') {
            children.push(
              new TextRun({
                text: inline.content,
                font: 'Courier New',
                italics: false,
                bold: false
              })
            );
          } else if (inline.type === 'link_open') {
            const linkText = childTokens[j + 1]?.content || '';
            const linkUrl = inline.attrGet('href') || '';
            children.push(createTextRun(`[${linkText}](${linkUrl})`));
            j++;
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

    if (token.type === 'fence') {
      const codeLines = token.content.split('\n');

      for (let k = 0; k < codeLines.length; k++) {
        const line = codeLines[k];
        const codeParagraph = new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: 'Courier New',
              size: 20,
              color: '333333'
            })
          ],
          indent:
            listStack.length > 0
              ? {
                  left: listStack.length * 720
                }
              : undefined,
          shading: {
            type: 'clear',
            color: 'auto',
            fill: 'EEEEEE'
          },
          spacing: k === codeLines.length - 1 ? { after: 200 } : { after: 0 },
          border:
            k === 0
              ? {
                  top: { size: 1, color: 'auto', style: BorderStyle.SINGLE },
                  left: { size: 1, color: 'auto', style: BorderStyle.SINGLE },
                  right: { size: 1, color: 'auto', style: BorderStyle.SINGLE }
                }
              : k === codeLines.length - 1
                ? {
                    bottom: { size: 1, color: 'auto', style: BorderStyle.SINGLE },
                    left: { size: 1, color: 'auto', style: BorderStyle.SINGLE },
                    right: { size: 1, color: 'auto', style: BorderStyle.SINGLE }
                  }
                : {
                    left: { size: 1, color: 'auto', style: BorderStyle.SINGLE },
                    right: { size: 1, color: 'auto', style: BorderStyle.SINGLE }
                  }
        });

        elements.push(codeParagraph);
      }

      continue;
    }

    if (token.type === 'paragraph_open') {
      const children: TextRun[] = [];
      const imageMarkdowns: string[] = [];

      if (listStack.length > 0 && isListItemStart) {
        const currentList = listStack[listStack.length - 1];
        const prefixText = currentList.type === 'ordered' ? `${currentList.order}. ` : `• `;

        children.push(
          new TextRun({
            text: prefixText
          })
        );

        isListItemStart = false;
      }

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
          } else if (inline.type === 'link_open') {
            const linkText = childTokens[j + 1]?.content || '';
            const linkUrl = inline.attrGet('href') || '';
            children.push(createTextRun(`[${linkText}](${linkUrl})`));
            j++;
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
        elements.push(
          new Paragraph({
            children,
            spacing: { after: 100 },
            indent:
              listStack.length > 0
                ? {
                    left: listStack.length * 720,
                    hanging: 360
                  }
                : undefined
          })
        );
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
  markdown,
  filename
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
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
  const finalFilename = filename ? `${filename}.docx` : `markdown-to-docx.docx`;
  const buf = Buffer.from(new Uint8Array(docBuffer));

  const result = await uploadFile({
    buffer: buf,
    defaultFilename: finalFilename
  });

  if (!result.accessUrl) {
    return Promise.reject('Upload failed: No access URL in result');
  }

  return { url: result.accessUrl };
}
