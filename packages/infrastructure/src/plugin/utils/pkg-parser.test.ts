import { BlobWriter, Uint8ArrayReader, ZipWriter } from '@zip.js/zip.js';
import { describe, expect, it } from 'vitest';

import { parsePkg } from './pkg-parser';

const baseManifest = {
  pluginId: 'etag-demo',
  version: '1.0.0',
  type: 'tool',
  name: {
    en: 'Etag demo',
    'zh-CN': 'Etag 示例'
  },
  icon: 'logo.svg',
  description: {
    en: 'Etag demo',
    'zh-CN': 'Etag 示例'
  },
  toolDescription: 'Etag demo',
  secretSchema: {}
};

const createPkg = async ({
  index = 'export default {};\n',
  lastModDate,
  readmeFiles = [],
  reverseEntries = false
}: {
  index?: string;
  lastModDate: Date;
  readmeFiles?: { filename: string; content: string }[];
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
    },
    ...readmeFiles.map(({ filename, content }) => ({ filename, buffer: Buffer.from(content) }))
  ];

  const writer = new ZipWriter(new BlobWriter('application/zip'));

  for (const entry of reverseEntries ? entries.reverse() : entries) {
    await writer.add(entry.filename, new Uint8ArrayReader(entry.buffer), {
      lastModDate
    });
  }

  return Buffer.from(await (await writer.close()).arrayBuffer());
};

const replaceZipFilename = (
  zipBuffer: Buffer,
  filename: string,
  replacement: string
): { buffer: Buffer; replacements: number } => {
  const filenameBuffer = Buffer.from(filename);
  const replacementBuffer = Buffer.from(replacement);
  if (filenameBuffer.length !== replacementBuffer.length) {
    throw new Error('ZIP filename replacements must have the same byte length');
  }

  const buffer = Buffer.from(zipBuffer);
  let replacements = 0;
  let index = buffer.indexOf(filenameBuffer);
  while (index !== -1) {
    replacementBuffer.copy(buffer, index);
    replacements += 1;
    index = buffer.indexOf(filenameBuffer, index + replacementBuffer.length);
  }

  return { buffer, replacements };
};

describe('parsePkg', () => {
  it('maps exact README locale filenames and preserves the legacy root README', async () => {
    const pkg = await createPkg({
      lastModDate: new Date('2026-01-01T00:00:00Z'),
      readmeFiles: [
        { filename: 'README.md', content: 'legacy readme' },
        { filename: 'README.en.md', content: 'english readme' },
        { filename: 'README.zh-CN.md', content: 'simplified Chinese readme' },
        { filename: 'README.zh-Hant.md', content: 'traditional Chinese readme' }
      ]
    });

    const [parsed, err] = await parsePkg({ input: pkg });

    expect(err).toBeNull();
    expect(parsed?.files).toMatchObject({
      readme: { filename: 'README.md' },
      readmes: {
        en: { filename: 'README.en.md' },
        'zh-CN': { filename: 'README.zh-CN.md' },
        'zh-Hant': { filename: 'README.zh-Hant.md' }
      }
    });
  });

  it('keeps a legacy root README without creating localized README entries', async () => {
    const pkg = await createPkg({
      lastModDate: new Date('2026-01-01T00:00:00Z'),
      readmeFiles: [{ filename: 'README.md', content: 'legacy readme' }]
    });

    const [parsed, err] = await parsePkg({ input: pkg });

    expect(err).toBeNull();
    expect(parsed?.files.readme?.filename).toBe('README.md');
    expect(parsed?.files).not.toHaveProperty('readmes');
  });

  it('preserves packages without a README', async () => {
    const pkg = await createPkg({ lastModDate: new Date('2026-01-01T00:00:00Z') });

    const [parsed, err] = await parsePkg({ input: pkg });

    expect(err).toBeNull();
    expect(parsed?.files).not.toHaveProperty('readme');
    expect(parsed?.files).not.toHaveProperty('readmes');
  });

  it('rejects README variants with unsupported locales', async () => {
    const pkg = await createPkg({
      lastModDate: new Date('2026-01-01T00:00:00Z'),
      readmeFiles: [{ filename: 'README.fr.md', content: 'French readme' }]
    });

    const [, err] = await parsePkg({ input: pkg });

    expect(err).not.toBeNull();
    expect(err?.reason.en).toContain('README');
  });

  it('rejects ambiguous README variant filenames', async () => {
    const pkg = await createPkg({
      lastModDate: new Date('2026-01-01T00:00:00Z'),
      readmeFiles: [{ filename: 'README.en.extra.md', content: 'Ambiguous README' }]
    });

    const [, err] = await parsePkg({ input: pkg });

    expect(err).not.toBeNull();
    expect(err?.reason.en).toContain('README');
  });

  it('rejects unsupported README variants under assets instead of treating them as assets', async () => {
    const pkg = await createPkg({
      lastModDate: new Date('2026-01-01T00:00:00Z'),
      readmeFiles: [{ filename: 'assets/README.fr.md', content: '<svg></svg>' }]
    });

    const [, err] = await parsePkg({ input: pkg });

    expect(err).not.toBeNull();
    expect(err?.reason.en).toContain('README');
  });

  it('rejects duplicate README locale filenames in a package', async () => {
    const pkg = await createPkg({
      lastModDate: new Date('2026-01-01T00:00:00Z'),
      readmeFiles: [
        { filename: 'README.en.md', content: 'First English README' },
        { filename: 'README.fr.md', content: 'Second English README' }
      ]
    });
    const { buffer: duplicateFilenamePkg, replacements } = replaceZipFilename(
      pkg,
      'README.fr.md',
      'README.en.md'
    );

    expect(replacements).toBe(2);

    const [, err] = await parsePkg({ input: duplicateFilenamePkg });

    expect(err).not.toBeNull();
    expect(err?.reason.en).toContain('README');
  });

  it('rejects case-conflicting filenames for the same README locale', async () => {
    const pkg = await createPkg({
      lastModDate: new Date('2026-01-01T00:00:00Z'),
      readmeFiles: [
        { filename: 'README.en.md', content: 'English README' },
        { filename: 'README.EN.md', content: 'Conflicting README' }
      ]
    });

    const [, err] = await parsePkg({ input: pkg });

    expect(err).not.toBeNull();
    expect(err?.reason.en).toContain('README');
  });

  it('rejects root README filenames that differ only by case', async () => {
    const pkg = await createPkg({
      lastModDate: new Date('2026-01-01T00:00:00Z'),
      readmeFiles: [
        { filename: 'README.md', content: 'Legacy README' },
        { filename: 'readme.md', content: 'Conflicting README' }
      ]
    });

    const [, err] = await parsePkg({ input: pkg });

    expect(err).not.toBeNull();
    expect(err?.reason.en).toContain('README');
  });

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
