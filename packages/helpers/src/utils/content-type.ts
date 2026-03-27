import { type ContentTypeType } from '@fastgpt-plugin/domain/value-objects/content-type.vo';

const FALLBACK_CONTENT_TYPE = 'application/octet-stream';

export function detectContentType(buffer: Buffer): ContentTypeType {
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

  return FALLBACK_CONTENT_TYPE;
}
