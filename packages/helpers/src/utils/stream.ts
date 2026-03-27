import { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';

export const getReadStreamFromURL = async (url: string): Promise<Readable | undefined> => {
  const response = await fetch(url);
  if (!response.ok) return undefined;
  if (!response.body) return undefined;

  // HACK: Type assertion to `ReadableStream` is necessary to avoid type errors
  // @refer: https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/65542
  return Readable.fromWeb(response.body as ReadableStream);
};
