import axios from 'axios';
import { Buffer } from 'buffer';

export async function downloadImage(url: string): Promise<Buffer> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error(`failed to download image: ${url}`, error);
    return Promise.reject(`failed to download image: ${url}`);
  }
}

export function getImageDimensions(buffer: Buffer): { width: number; height: number } {
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
    // BMP
    if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
      return {
        width: buffer.readUInt32LE(18),
        height: buffer.readUInt32LE(22)
      };
    }
  } catch (error) {
    console.warn('failed to get image dimensions, using default values', error);
  }
  return { width: 400, height: 300 };
}

export function getImageExtension(url: string): 'png' | 'jpg' | 'gif' | 'bmp' {
  const ext = url.toLowerCase().split('.').pop() || '';
  if (ext === 'jpg' || ext === 'jpeg') return 'jpg';
  if (ext === 'gif') return 'gif';
  if (ext === 'bmp') return 'bmp';
  return 'png';
}

export function extractImageInfo(text: string): { alt: string; url: string } | null {
  const match = /!\[([^\]]*)\]\(([^)]+)\)/.exec(text);
  if (match) return { alt: match[1], url: match[2] };
  return null;
}

export function extractLinkInfo(text: string): { text: string; url: string } | null {
  const match = /\[([^\]]+)\]\(([^)]+)\)/.exec(text);
  if (match) return { text: match[1], url: match[2] };
  return null;
}

export function parseMarkdownLine(line: string): {
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

export function parseMarkdownTable(tableBlock: string): { header: string[]; rows: string[][] } {
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

export function calculateTextLines(text: string, columnWidth: number): number {
  if (!text) return 1;
  const charsPerLine = Math.floor(columnWidth * 2.5);
  const lineBreaks = text.split('\n').length;
  const autoWrapLines = Math.ceil(text.length / charsPerLine);
  return Math.max(lineBreaks, autoWrapLines);
}

export function calculateDisplaySize(
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
