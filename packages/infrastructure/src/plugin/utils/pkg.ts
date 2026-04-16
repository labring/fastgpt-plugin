import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

import { ZipReaderStream, ZipWriterStream } from '@zip.js/zip.js';

/**
 * @example
 * ```ts
 * // a normal file
 * {
 *   filename: 'manifest.json',
 *   directory: false,
 *   readable: new Blob(['demo']).stream(),
 * };
 *
 * // a directory
 * {
 *   filename: 'assets',
 *   directory: true,
 * };
 * ```
 */
export type EntiesType = {
  filename: string;
  directory?: boolean;
  stream?: Readable;
}[];

/**
 * Build a PKG package from a stream of entries.
 *
 * The input stream may contain directory entries and file entries.
 * For file entries, `readable` must be provided. For directory entries,
 * set `directory: true` and omit `readable`.
 *
 * @example
 * ```ts
 * const input = ReadableStream.from([
 *   {
 *     filename: 'manifest.json',
 *     readable: new Blob(['demo']).stream(),
 *   },
 *   {
 *     filename: 'assets',
 *     directory: true,
 *   },
 *   {
 *     filename: 'assets/pic.png',
 *     readable: new Blob(['']).stream(),
 *   },
 * ]);
 *
 * const pkgStream = pkg(input);
 * ```
 */
export const pkg = async (entries: EntiesType): Promise<Readable> => {
  const zipWriter = new ZipWriterStream();

  for (const entry of entries) {
    if (entry.directory) {
      const writer = zipWriter.writable(entry.filename);
      writer.getWriter().close();
      continue;
    }

    if (!entry.stream) {
      throw new Error(`Missing readable stream for file: ${entry.filename}`);
    }
    const stream = Readable.toWeb(entry.stream) as ReadableStream<Uint8Array>;

    await stream.pipeTo(zipWriter.writable(entry.filename));
  }

  return Readable.fromWeb(zipWriter.readable as ReadableStream);
};

/**
 * Unzip a PKG stream and return a stream of entries.
 *
 * @example
 * ```ts
 * const pkgStream = pkg(
 *   ReadableStream.from([
 *     {
 *       filename: 'manifest.json',
 *       readable: new Blob(['demo']).stream(),
 *     },
 *   ]),
 * );
 *
 * const entriesStream = unpkg(pkgStream);
 *
 * for await (const entry of entriesStream) {
 *   if (entry.directory) {
 *     console.log('dir:', entry.filename);
 *     continue;
 *   }
 *
 *   const text = await new Response(entry.readable!).text();
 *   console.log(entry.filename, text);
 * }
 * ```
 */
export const unpkg = async (_pkgStream: Readable): Promise<EntiesType> => {
  const zipReader = new ZipReaderStream();
  const pkgStream = Readable.toWeb(_pkgStream) as globalThis.ReadableStream<Uint8Array>;
  const entriesStream = pkgStream.pipeThrough(zipReader);
  const reader = entriesStream.getReader();
  const entries: EntiesType = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      entries.push({
        filename: value.filename,
        directory: value.directory,
        stream: value.directory
          ? undefined
          : Readable.fromWeb(value.readable as ReadableStream<Uint8Array>)
      });
    }

    return entries;
  } finally {
    reader.releaseLock();
  }
};
