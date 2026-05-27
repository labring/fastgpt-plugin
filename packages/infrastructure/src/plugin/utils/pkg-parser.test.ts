import { BlobWriter, Uint8ArrayReader, ZipWriter } from '@zip.js/zip.js';
import { describe, expect, it } from 'vitest';

import { parsePkg } from './pkg-parser';

const baseManifest = {
  pluginId: 'etag-demo',
  version: '1.0.0',
  type: 'tool',
  name: {
    en: 'Etag demo'
  },
  icon: 'logo.svg',
  description: {
    en: 'Etag demo'
  },
  toolDescription: 'Etag demo',
  secretSchema: {}
};

const createPkg = async ({
  index = 'export default {};\n',
  lastModDate,
  reverseEntries = false
}: {
  index?: string;
  lastModDate: Date;
  reverseEntries?: boolean;
}) => {
  const entries = [
    {
      filename: 'index.js',
      buffer: Buffer.from(index)
    },
    {
      filename: 'manifest.json',
      buffer: Buffer.from(JSON.stringify(baseManifest, null, 2))
    },
    {
      filename: 'logo.svg',
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')
    }
  ];
  const writer = new ZipWriter(new BlobWriter('application/zip'));

  for (const entry of reverseEntries ? entries.reverse() : entries) {
    await writer.add(entry.filename, new Uint8ArrayReader(entry.buffer), {
      lastModDate
    });
  }

  return Buffer.from(await (await writer.close()).arrayBuffer());
};

describe('parsePkg', () => {
  it('computes the same etag for packages with identical extracted files', async () => {
    const firstPkg = await createPkg({
      lastModDate: new Date('2026-01-01T00:00:00Z')
    });
    const secondPkg = await createPkg({
      lastModDate: new Date('2026-02-01T00:00:00Z'),
      reverseEntries: true
    });

    expect(firstPkg.equals(secondPkg)).toBe(false);

    const [firstParsed, firstErr] = await parsePkg({ input: firstPkg });
    const [secondParsed, secondErr] = await parsePkg({ input: secondPkg });

    expect(firstErr).toBeNull();
    expect(secondErr).toBeNull();
    expect(firstParsed?.info.etag).toBe(secondParsed?.info.etag);
  });

  it('changes the etag when an extracted file changes', async () => {
    const firstPkg = await createPkg({
      lastModDate: new Date('2026-01-01T00:00:00Z')
    });
    const secondPkg = await createPkg({
      index: 'export const changed = true;\n',
      lastModDate: new Date('2026-01-01T00:00:00Z')
    });

    const [firstParsed, firstErr] = await parsePkg({ input: firstPkg });
    const [secondParsed, secondErr] = await parsePkg({ input: secondPkg });

    expect(firstErr).toBeNull();
    expect(secondErr).toBeNull();
    expect(firstParsed?.info.etag).not.toBe(secondParsed?.info.etag);
  });
});
