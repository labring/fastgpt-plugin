import { z } from 'zod';
import { uploadFile } from '@tool/utils/uploadFile';
import ExcelJS, { type Buffer as ExcelBuffer } from 'exceljs';
import axios from 'axios';
import { Buffer } from 'buffer';

export const InputType = z.object({
  markdown: z.string().describe('Markdown content to convert')
});

export const OutputType = z.object({
  downloadUrl: z.string().describe('URL to download the converted file')
});

async function processLineWithImages(
  workbook: ExcelJS.Workbook,
  worksheet: ExcelJS.Worksheet,
  line: string,
  currentRow: number
): Promise<number> {
  let remainingText = line;
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = imageRegex.exec(remainingText)) !== null) {
    const beforeText = remainingText.slice(0, match.index).trim();
    if (beforeText) {
      const { text, style } = parseMarkdownLine(beforeText);
      const cell = worksheet.getCell(currentRow, 1);
      cell.value = text;
      cell.font = {
        name: 'Arial',
        size: style.isTitle ? 12 + (6 - style.isTitle) : 11,
        bold: !!style.isTitle,
        italic: style.isQuote
      };
      cell.alignment = {
        vertical: 'top',
        horizontal: 'left',
        indent: style.isList ? 1 : 0,
        wrapText: true
      };
      const column = worksheet.getColumn(1);
      const safeColumnWidth = column.width ?? 50;
      const lineCount = calculateTextLines(text, safeColumnWidth);
      const rowHeight = style.isTitle ? Math.max(lineCount * 20, 25) : lineCount * 16;
      worksheet.getRow(currentRow).height = rowHeight;
      currentRow++;
    }

    const url = match[2];
    try {
      const buffer = await downloadImage(url);
      const { width: imgWidth, height: imgHeight } = getImageDimensions(buffer);
      const column = worksheet.getColumn(1);
      const columnWidth = column.width ?? 50;
      const cellWidthPx = columnWidth * 7.5;
      const ratio = imgWidth / imgHeight;

      let displayWidth = Math.min(imgWidth, cellWidthPx * 0.9);
      let displayHeight = displayWidth / ratio;
      if (displayHeight > 400) {
        displayHeight = 400 * 0.9;
        displayWidth = displayHeight * ratio;
      }

      const imageId = workbook.addImage({
        buffer: buffer as unknown as ExcelBuffer,
        extension: getImageExtension(url)
      });

      worksheet.addImage(imageId, {
        tl: { col: 0, row: currentRow - 1, nativeColOff: 0, nativeRowOff: 0 },
        ext: { width: displayWidth, height: displayHeight },
        editAs: 'twoCell'
      });

      const cell = worksheet.getCell(currentRow, 1);
      cell.value = '';
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(currentRow).height = Math.ceil(displayHeight / 0.75) + 10;
      currentRow++;
    } catch (error) {
      const cell = worksheet.getCell(currentRow, 1);
      cell.value = '[image loading failed]';
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      worksheet.getRow(currentRow).height = 20;
      currentRow++;
      console.error('failed to handle image:', error);
    }

    remainingText = remainingText.slice(match.index + match[0].length).trim();
    imageRegex.lastIndex = 0;
  }

  if (remainingText) {
    const { text, style } = parseMarkdownLine(remainingText);
    const cell = worksheet.getCell(currentRow, 1);
    cell.value = text;
    cell.font = {
      name: 'Arial',
      size: style.isTitle ? 12 + (6 - style.isTitle) : 11,
      bold: !!style.isTitle,
      italic: style.isQuote
    };
    cell.alignment = {
      vertical: 'top',
      horizontal: 'left',
      indent: style.isList ? 1 : 0,
      wrapText: true
    };
    const column = worksheet.getColumn(1);
    const safeColumnWidth = column.width ?? 50;
    const lineCount = calculateTextLines(text, safeColumnWidth);
    const rowHeight = style.isTitle ? Math.max(lineCount * 20, 25) : lineCount * 16;
    worksheet.getRow(currentRow).height = rowHeight;
    currentRow++;
  }

  return currentRow;
}

function extractImageInfo(text: string): { alt: string; url: string } | null {
  const match = /!\[([^\]]*)\]\(([^)]+)\)/.exec(text);
  if (match) return { alt: match[1], url: match[2].split('!')[0] };
  return null;
}

function getImageExtension(url: string): 'png' | 'jpeg' | 'gif' {
  const ext = url.toLowerCase().split('.').pop() || '';
  if (ext === 'jpg' || ext === 'jpeg') return 'jpeg';
  if (ext === 'gif') return 'gif';
  return 'png';
}

async function downloadImage(url: string): Promise<Buffer> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error(`failed to download image: ${url}`, error);
    throw new Error(`failed to download image: ${url}`);
  }
}

function getImageDimensions(buffer: Buffer): { width: number; height: number } {
  try {
    // PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20)
      };
    }
    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      let i = 2;
      while (i < buffer.length) {
        if (buffer[i] === 0xff) {
          const marker = buffer[i + 1];
          if (marker === 0xc0 || marker === 0xc2) {
            return {
              height: buffer.readUInt16BE(i + 5),
              width: buffer.readUInt16BE(i + 7)
            };
          }
          i += 2 + buffer.readUInt16BE(i + 2);
        } else {
          i++;
        }
      }
    }
    // GIF
    if (
      buffer.toString('ascii', 0, 6) === 'GIF87a' ||
      buffer.toString('ascii', 0, 6) === 'GIF89a'
    ) {
      return {
        width: buffer.readUInt16LE(6),
        height: buffer.readUInt16LE(8)
      };
    }
  } catch (error) {
    console.warn('failed to get image dimensions, using default values', error);
  }
  return { width: 400, height: 300 };
}

function parseMarkdownTable(tableBlock: string): { header: string[]; rows: string[][] } {
  const lines = tableBlock
    .trim()
    .split('\n')
    .filter((line) => line.trim() !== '');
  const allRows: string[][] = [];

  for (const line of lines) {
    if (/^\s*\|[\s\-:|]+\|\s*$/.test(line.trim())) continue;

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length > 0) allRows.push(cells);
  }

  const header = allRows.length > 0 ? allRows[0] : [];
  const rows = allRows.length > 1 ? allRows.slice(1) : [];

  if (header.length > 0) {
    const headerLength = header.length;
    rows.forEach((row, index) => {
      while (row.length < headerLength) row.push('');
      rows[index] = row.slice(0, headerLength);
    });
  }

  return { header, rows };
}

function parseMarkdownLine(line: string): {
  text: string;
  style: {
    isTitle?: number;
    isList?: boolean;
    isQuote?: boolean;
    isHorizontalLine?: boolean;
  };
} {
  const titleMatch = /^#{1,6}\s+(.*)$/.exec(line);
  if (titleMatch) {
    return {
      text: titleMatch[1].trim(),
      style: { isTitle: titleMatch[0].split('#').length - 1 }
    };
  }

  const listMatch = /^[-*+]\s+(.*)$/.exec(line);
  if (listMatch) {
    return {
      text: `• ${listMatch[1].trim()}`,
      style: { isList: true }
    };
  }

  const quoteMatch = /^>\s+(.*)$/.exec(line);
  if (quoteMatch) {
    return {
      text: quoteMatch[1].trim(),
      style: { isQuote: true }
    };
  }

  if (/^[-*_]{3,}\s*$/.test(line)) {
    return {
      text: '',
      style: { isHorizontalLine: true }
    };
  }

  return {
    text: line.trim(),
    style: {}
  };
}
async function handleImageCell(
  workbook: ExcelJS.Workbook,
  worksheet: ExcelJS.Worksheet,
  imageInfo: { alt: string; url: string },
  row: number,
  col: number
): Promise<number> {
  try {
    const buffer = await downloadImage(imageInfo.url);
    const { width: imgWidth, height: imgHeight } = getImageDimensions(buffer);

    const column = worksheet.getColumn(col + 1);
    const columnWidth = column.width ?? 20;
    const cellWidthPx = columnWidth * 7.5;
    const ratio = imgWidth / imgHeight;

    let displayWidth = Math.min(imgWidth, cellWidthPx * 0.9);
    let displayHeight = displayWidth / ratio;

    if (displayHeight > 400) {
      displayHeight = 400 * 0.9;
      displayWidth = displayHeight * ratio;
    }

    const imageId = workbook.addImage({
      buffer: buffer as unknown as ExcelBuffer,
      extension: getImageExtension(imageInfo.url)
    });

    worksheet.addImage(imageId, {
      tl: { col, row: row - 1, nativeColOff: 11231231231, nativeRowOff: 0 },
      ext: { width: displayWidth, height: displayHeight },
      editAs: 'twoCell'
    });

    const cell = worksheet.getCell(row, col + 1);
    cell.value = '';
    cell.alignment = { vertical: 'middle', horizontal: 'center' };

    return Math.ceil(displayHeight / 0.75) + 10;
  } catch (error) {
    console.error('failed to handle image:', error);
    const cell = worksheet.getCell(row, col + 1);
    cell.value = '[image loading failed]';
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    return 20;
  }
}

function calculateTextLines(text: string, columnWidth: number): number {
  if (!text) return 1;
  const charsPerLine = Math.floor(columnWidth * 2.5);
  const lineBreaks = text.split('\n').length;
  const autoWrapLines = Math.ceil(text.length / charsPerLine);
  return Math.max(lineBreaks, autoWrapLines);
}

function handleTextCell(
  worksheet: ExcelJS.Worksheet,
  text: string,
  row: number,
  col: number
): number {
  const cell = worksheet.getCell(row, col + 1);
  const column = worksheet.getColumn(col + 1);

  const safeColumnWidth = column.width ?? 20;

  cell.value = text;
  cell.alignment = {
    vertical: 'top',
    horizontal: 'left',
    wrapText: true
  };

  const lineCount = calculateTextLines(text, safeColumnWidth);
  return lineCount * 15;
}

async function createExcelFromMarkdown(markdown: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Markdown content');

  worksheet.columns = [{ width: 50 }];

  worksheet.pageSetup = {
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    margins: { top: 0.8, right: 0.8, bottom: 0.8, left: 0.8, header: 0.3, footer: 0.3 }
  };

  let currentRow = 1;

  const processedMarkdown = markdown.replace(/\n{2,}/g, '\n\n');
  const blocks = processedMarkdown
    .split('\n\n')
    .map((block) => block.trim())
    .filter((block) => block !== '');

  for (const block of blocks) {
    const hasTableSeparator = /\|[\s\-:|]+\|/.test(block);
    const isTable = block.includes('|') && hasTableSeparator;

    if (isTable) {
      const { header, rows: tableRows } = parseMarkdownTable(block);
      if (header.length === 0) continue;

      const columnCount = header.length;
      worksheet.columns = Array.from({ length: columnCount }, () => ({ width: 20 }));

      const headerRow = currentRow;
      for (const [colIdx, headerText] of header.entries()) {
        const column = worksheet.getColumn(colIdx + 1);
        const { text } = parseMarkdownLine(headerText);

        const cell = worksheet.getCell(headerRow, colIdx + 1);
        cell.value = text;
        cell.font = { name: 'Arial', size: 11, bold: true };
        cell.alignment = {
          vertical: 'top',
          horizontal: 'center',
          wrapText: true
        };

        const lineCount = calculateTextLines(text, column.width || 0);
        const rowHeight = lineCount * 15;
        worksheet.getRow(headerRow).height = rowHeight;
      }

      const contentStartRow = currentRow + 1;
      for (const [rowIdx, rowData] of tableRows.entries()) {
        const excelRow = contentStartRow + rowIdx;
        let maxRowHeight = 20;

        for (const [colIdx, cellContent] of rowData.entries()) {
          const imageInfo = extractImageInfo(cellContent);
          if (imageInfo) {
            const imgRowHeight = await handleImageCell(
              workbook,
              worksheet,
              imageInfo,
              excelRow,
              colIdx
            );
            maxRowHeight = Math.max(maxRowHeight, imgRowHeight);
          } else {
            const { text } = parseMarkdownLine(cellContent);
            const textRowHeight = handleTextCell(worksheet, text, excelRow, colIdx);
            maxRowHeight = Math.max(maxRowHeight, textRowHeight);
          }
        }

        worksheet.getRow(excelRow).height = maxRowHeight;
      }

      for (let colIdx = 0; colIdx < columnCount; colIdx++) {
        const column = worksheet.getColumn(colIdx + 1);
        let maxTextLength = 0;

        const headerText = parseMarkdownLine(header[colIdx]).text;
        maxTextLength = Math.max(maxTextLength, headerText.length);

        tableRows.forEach((rowData) => {
          const cellText = parseMarkdownLine(rowData[colIdx] || '').text;
          maxTextLength = Math.max(maxTextLength, cellText.length);
        });

        column.width = Math.min(Math.max(maxTextLength * 1.2, 15), 30);
      }

      currentRow = contentStartRow + tableRows.length + 1;
    } else {
      const lines = block
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '');

      for (const line of lines) {
        currentRow = await processLineWithImages(workbook, worksheet, line, currentRow);
      }

      if (blocks.indexOf(block) !== blocks.length - 1) {
        currentRow++;
      }
    }
  }

  if (worksheet.columns.length === 1) {
    const column = worksheet.getColumn(1);
    if (column) {
      let maxLength = 20;
      column.eachCell({ includeEmpty: false }, (cell) => {
        const cellValue = cell.value?.toString() || '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = Math.min(maxLength * 1.1, 60);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

export async function xlsxTool(
  input: z.infer<typeof InputType>
): Promise<z.infer<typeof OutputType>> {
  const { markdown } = input;
  try {
    const xlsxBuffer = await createExcelFromMarkdown(markdown);
    const result = await uploadFile({
      buffer: xlsxBuffer,
      defaultFilename: `markdown-to-excel-${Date.now()}.xlsx`
    });

    return { downloadUrl: result.accessUrl };
  } catch (error) {
    console.error('failed to generate excel:', error);
    throw new Error(`failed to generate excel: ${(error as Error).message}`);
  }
}
