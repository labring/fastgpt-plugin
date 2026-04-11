import path from 'node:path';

import z from 'zod';

export const CommonMIMETypes = [
  'application/javascript',
  'application/json',
  'application/yaml',
  'application/zip',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'text/markdown',
  'audio/mpeg',
  'video/mp4',
  'audio/wav',
  'text/html',
  'application/xml',
  'application/gzip',
  'application/octet-stream',
  'multipart/form-data',
  'text/event-stream'
] as const;

export const MIMESchema = z.enum(CommonMIMETypes).and(z.string().regex(/^[^/]+\/[^/]+$/));

export type MIMEType = z.infer<typeof MIMESchema>;

export const ExtMimeMap: Record<string, MIMEType> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.zip': 'application/zip',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.doc': 'application/msword',
  '.xls': 'application/vnd.ms-excel',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.js': 'application/javascript',
  '.md': 'text/markdown',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav',
  '.html': 'text/html',
  '.xml': 'application/xml',
  '.gz': 'application/gzip'
} as const;

export function getMimeTypeFromFilename(filename: string): MIMEType | undefined {
  const ext = path.extname(filename);
  return ExtMimeMap[ext as keyof typeof ExtMimeMap];
}

const FALLBACK_CONTENT_TYPE = 'application/octet-stream';

export function detectMimeTypeFromContent(
  buffer: Buffer,
  fallback: MIMEType = FALLBACK_CONTENT_TYPE
): MIMEType {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }

  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return 'image/jpeg';
  }

  if (buffer.length >= 6) {
    const header = buffer.subarray(0, 6).toString('ascii');
    if (header === 'GIF87a' || header === 'GIF89a') {
      return 'image/gif';
    }
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === '%PDF') {
    return 'application/pdf';
  }

  if (buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
    return 'application/zip';
  }

  if (buffer.length >= 2 && buffer.subarray(0, 2).equals(Buffer.from([0x1f, 0x8b]))) {
    return 'application/gzip';
  }

  if (buffer.length >= 3 && buffer.subarray(0, 3).toString('ascii') === 'ID3') {
    return 'audio/mpeg';
  }

  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    return 'video/mp4';
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WAVE'
  ) {
    return 'audio/wav';
  }

  const text = buffer.subarray(0, Math.min(buffer.length, 256)).toString('utf8').trimStart();

  if (text.startsWith('{') || text.startsWith('[')) {
    return 'application/json';
  }

  if (text.startsWith('<svg') || text.startsWith('<?xml')) {
    return text.startsWith('<svg') ? 'image/svg+xml' : 'application/xml';
  }

  if (text.startsWith('<!DOCTYPE html') || text.startsWith('<html')) {
    return 'text/html';
  }

  const isProbablyText = buffer.subarray(0, Math.min(buffer.length, 512)).every((byte) => {
    return byte === 0x09 || byte === 0x0a || byte === 0x0d || (byte >= 0x20 && byte <= 0x7e);
  });

  if (isProbablyText) {
    return 'text/plain';
  }

  return fallback;
}
