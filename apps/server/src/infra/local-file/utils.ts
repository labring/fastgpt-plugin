import { createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Readable, Transform, Writable } from 'node:stream';
import type { WriteStream } from 'node:fs';
import { detectContentType } from '@fastgpt-plugin/helpers/utils/content-type';

export function calculateChecksum(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function createMetaTracker() {
  const hash = createHash('sha256');
  const chunks: Buffer[] = [];
  let total = 0;
  let size = 0;

  const transform = new Transform({
    transform(chunk, _encoding, callback) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      hash.update(buffer);
      size += buffer.length;

      if (total < 512) {
        const slice = buffer.subarray(0, 512 - total);
        chunks.push(slice);
        total += slice.length;
      }

      callback(null, buffer);
    }
  });

  return {
    transform,
    getMeta: () => ({
      etag: hash.digest('hex'),
      contentType: detectContentType(Buffer.concat(chunks)),
      size
    })
  };
}

/**
 * Extracts the meta information from the stream.
 */
export async function getMetaFromStream(stream: Readable) {
  const { transform, getMeta } = createMetaTracker();
  await pipeline(
    stream,
    transform,
    new Writable({
      write(_c, _e, cb) {
        cb();
      }
    })
  );
  return getMeta();
}

/**
 * Saves the file to the write stream and returns the meta information.
 */
export async function saveFileAndGetMeta(writeStream: WriteStream, stream: Readable) {
  const { transform, getMeta } = createMetaTracker();
  await pipeline(stream, transform, writeStream);
  return getMeta();
}
