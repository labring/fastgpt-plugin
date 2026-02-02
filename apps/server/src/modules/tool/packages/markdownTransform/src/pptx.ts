import { z } from 'zod';
import { uploadFile } from '@tool/utils/uploadFile';
import PptxGenJS from 'pptxgenjs';
import MarkdownIt from 'markdown-it';
import { OutputType } from './type';
import {
  downloadImage,
  getImageDimensions,
  calculateDisplaySize,
  getImageExtension
} from './shared';

export const InputType = z.object({
  markdown: z.string().describe('Markdown content to convert'),
  filename: z.string().optional().describe('Custom filename without extension')
});

// slide styles config
const slideStyles = {
  title: {
    fontSize: 44,
    bold: true,
    color: '333333'
  },
  subtitle: {
    fontSize: 24,
    color: '666666'
  },
  heading: {
    fontSize: 32,
    bold: true,
    color: '333333'
  },
  body: {
    fontSize: 18,
    color: '333333'
  },
  list: {
    fontSize: 16,
    color: '333333'
  },
  code: {
    fontSize: 14,
    color: '333333',
    fontFace: 'Courier New',
    fill: { color: 'EEEEEE' }
  },
  table: {
    fontSize: 14,
    color: '333333',
    border: { type: 'solid' as const, color: 'CCCCCC', pt: 1 },
    fill: { color: 'EEEEEE' }
  },
  tableCell: {
    fontSize: 14,
    color: '333333'
  },
  error: {
    fontSize: 14,
    color: '666666',
    italic: true
  }
};

function createRichText(
  text: string,
  options: { bold?: boolean; italic?: boolean; color?: string; size?: number } = {}
): {
  text: string;
  options: { bold?: boolean; italic?: boolean; color?: string; size?: number };
} {
  return {
    text,
    options: {
      ...options
    }
  };
}

async function processImageFromText(text: string, slide: PptxGenJS.Slide): Promise<boolean> {
  const imageMatch = text.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  if (!imageMatch) return false;

  const [, alt, src] = imageMatch;

  try {
    const imageBuffer = await downloadImage(src);
    const originalDimensions = getImageDimensions(imageBuffer);
    const displaySize = calculateDisplaySize(originalDimensions.width, originalDimensions.height);

    // PptxGenJS uses inches as unit, so need to convert pixels to inches
    const dpi = 96;
    const widthInches = displaySize.width / dpi;
    const heightInches = displaySize.height / dpi;
    // PptxGenJS uses base64 as data format, cannot use imageBuffer directly
    const imageData = `data:image/${getImageExtension(src)};base64,${imageBuffer.toString('base64')}`;

    slide.addImage({
      data: imageData,
      x: 0.5,
      y: 0.5,
      w: widthInches,
      h: heightInches
    });

    return true;
  } catch (error) {
    console.warn(`processImageFromText error: ${src}`, error);
    const errorSegments = [
      createRichText(`processImageFromText error: ${alt || src}`, {
        size: slideStyles.error.fontSize,
        color: slideStyles.error.color
      })
    ];
    slide.addText(errorSegments, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.5,
      ...slideStyles.error
    });

    return false;
  }
}

function parseInline(
  content: string,
  baseOptions: { fontSize?: number; color?: string } = {}
): any[] {
  const segments: any[] = [];
  const regex = /(\*\*.+?\*\*|\*.+?\*|\[.+?\]\(.+?\)|[^*[\]]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const part = match[1];
    if (part.startsWith('**') && part.endsWith('**')) {
      segments.push(
        createRichText(part.slice(2, -2), {
          ...baseOptions,
          bold: true
        })
      );
    } else if (part.startsWith('*') && part.endsWith('*')) {
      segments.push(
        createRichText(part.slice(1, -1), {
          ...baseOptions,
          italic: true
        })
      );
    } else if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      segments.push(createRichText(part, baseOptions));
    } else if (part.trim()) {
      segments.push(createRichText(part, baseOptions));
    }
  }

  return segments;
}

async function parseTableTokens(
  tokens: any[],
  startIndex: number
): Promise<{ tableData: any[][]; nextIndex: number }> {
  const tableData: any[][] = [];
  let i = startIndex + 1;

  while (i < tokens.length && tokens[i].type !== 'table_close') {
    if (tokens[i].type === 'tr_open') {
      const row: any[] = [];
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

          const cellTextTrimmed = cellText.trim();
          // if not empty cell, parse inline, and push to row
          if (cellTextTrimmed) {
            const cellSegments = parseInline(cellTextTrimmed, {
              fontSize: slideStyles.tableCell.fontSize,
              color: slideStyles.tableCell.color
            });

            const cellObject = {
              text: cellSegments.map((seg) => seg.text).join(''),
              options: {
                fontSize: slideStyles.tableCell.fontSize,
                color: slideStyles.tableCell.color,
                bold: cellSegments.some((seg) => seg.options?.bold),
                italic: cellSegments.some((seg) => seg.options?.italic)
              }
            };
            row.push(cellObject);
          } else {
            // if cell is empty, push empty object to row
            row.push({
              text: '',
              options: {
                fontSize: slideStyles.tableCell.fontSize,
                color: slideStyles.tableCell.color
              }
            });
          }
          i++;
        } else {
          i++;
        }
      }
      tableData.push(row);
      i++;
    } else {
      i++;
    }
  }

  return { tableData, nextIndex: i };
}

async function parseMarkdownToPptx(markdown: string): Promise<Buffer> {
  const md = new MarkdownIt();
  const tokens = md.parse(markdown, {});
  const pptx = new PptxGenJS();

  let currentSlide: PptxGenJS.Slide | null = null;
  let yPosition = 0.5;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'heading_open') {
      // if current slide exists and yPosition is greater than 1, set current slide to null and yPosition to 0.5
      if (currentSlide && yPosition > 1) {
        currentSlide = null;
        yPosition = 0.5;
      }
      // get heading level
      const level = Number(token.tag.slice(1));
      const inlineToken = tokens[i + 1];

      if (inlineToken?.type === 'inline' && inlineToken.children) {
        const childTokens = inlineToken.children;
        let titleText = '';

        for (const child of childTokens) {
          if (child.type === 'text') {
            titleText += child.content;
          } else if (child.type === 'strong_open') {
            const next = childTokens[childTokens.indexOf(child) + 1];
            if (next?.type === 'text') {
              titleText += `**${next.content}**`;
            }
          } else if (child.type === 'em_open') {
            const next = childTokens[childTokens.indexOf(child) + 1];
            if (next?.type === 'text') {
              titleText += `*${next.content}*`;
            }
          }
        }

        currentSlide = pptx.addSlide();

        if (level === 1) {
          const titleSegments = parseInline(titleText, {
            fontSize: slideStyles.title.fontSize,
            color: slideStyles.title.color
          });

          currentSlide.addText(titleSegments, {
            x: 1,
            y: 2,
            w: 8,
            h: 2,
            align: 'center'
          });
        } else {
          const titleSegments = parseInline(titleText, {
            fontSize: slideStyles.heading.fontSize,
            color: slideStyles.heading.color
          });

          currentSlide.addText(titleSegments, {
            x: 0.5,
            y: yPosition,
            w: 9,
            h: 1
          });
          yPosition += 1.2;
        }
      }

      i += 2;
      continue;
    }

    if (token.type === 'fence') {
      // if there is no current slide, add a new slide and set yPosition to 0.5
      if (!currentSlide) {
        currentSlide = pptx.addSlide();
        yPosition = 0.5;
      }

      const codeLines = token.content.split('\n');
      for (const line of codeLines) {
        if (line.trim()) {
          currentSlide.addText(
            [
              createRichText(line, {
                size: slideStyles.code.fontSize,
                color: slideStyles.code.color
              })
            ],
            {
              x: 0.5,
              y: yPosition,
              w: 9,
              h: 0.5,
              ...slideStyles.code
            }
          );
          yPosition += 0.6;
        }
      }
      yPosition += 0.5;
      continue;
    }

    if (token.type === 'paragraph_open') {
      if (!currentSlide) {
        currentSlide = pptx.addSlide();
        yPosition = 0.5;
      }

      const inlineToken = tokens[i + 1];
      if (inlineToken?.type === 'inline' && inlineToken.children) {
        const childTokens = inlineToken.children;
        let paragraphText = '';
        const hasImages: string[] = [];

        for (let j = 0; j < childTokens.length; j++) {
          const child = childTokens[j];

          if (child.type === 'text') {
            paragraphText += child.content;
          } else if (child.type === 'strong_open') {
            const next = childTokens[j + 1];
            if (next?.type === 'text') {
              paragraphText += `**${next.content}**`;
              j++;
            }
          } else if (child.type === 'em_open') {
            const next = childTokens[j + 1];
            if (next?.type === 'text') {
              paragraphText += `*${next.content}*`;
              j++;
            }
            // in PPTX, images will be treated as paragraph content, not inline content
          } else if (child.type === 'image') {
            const alt = child.attrGet('alt') || '';
            const src = child.attrGet('src');
            if (src) {
              hasImages.push(`![${alt}](${src})`);
            }
          }
        }

        if (paragraphText.trim()) {
          const textSegments = parseInline(paragraphText, {
            fontSize: slideStyles.body.fontSize,
            color: slideStyles.body.color
          });

          currentSlide.addText(textSegments, {
            x: 0.5,
            y: yPosition,
            w: 9,
            h: 0.8
          });
          yPosition += 1;
        }

        for (const imageMarkdown of hasImages) {
          // Always create a new slide for each image, but do not overwrite currentSlide
          const imageSlide = pptx.addSlide();
          await processImageFromText(imageMarkdown, imageSlide);
        }
      }

      i += 2;
      continue;
    }

    if (token.type === 'table_open') {
      if (!currentSlide) {
        currentSlide = pptx.addSlide();
        yPosition = 0.5;
      }

      const { tableData, nextIndex } = await parseTableTokens(tokens, i);
      if (tableData.length > 0) {
        currentSlide.addTable(tableData, {
          x: 0.5,
          y: yPosition,
          w: 9,
          h: 5,
          ...slideStyles.table
        });
        yPosition += 5.5;
      }
      i = nextIndex;
      continue;
    }

    if (currentSlide && yPosition > 6) {
      currentSlide = null;
      yPosition = 0.5;
    }
  }

  if (!currentSlide) {
    const slide = pptx.addSlide();
    slide.addText('empty content', {
      x: 1,
      y: 2,
      w: 8,
      h: 2,
      ...slideStyles.title,
      align: 'center'
    });
  }

  const pptxBuffer = await pptx.write({ outputType: 'nodebuffer' });
  return Buffer.from(pptxBuffer as ArrayBuffer);
}

export async function pptxTool(
  input: z.infer<typeof InputType>
): Promise<z.infer<typeof OutputType>> {
  const { markdown, filename } = input;
  const pptxBuffer = await parseMarkdownToPptx(markdown);
  const finalFilename = filename ? `${filename}.pptx` : `markdown-to-pptx.pptx`;
  const result = await uploadFile({
    buffer: pptxBuffer,
    defaultFilename: finalFilename
  });
  if (!result.accessUrl) {
    return Promise.reject('Upload failed: No access URL in result');
  }

  return { url: result.accessUrl };
}
