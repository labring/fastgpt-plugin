import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';

import { BlobWriter, Uint8ArrayReader, ZipWriter } from '@zip.js/zip.js';
import { describe, expect, it, vi } from 'vitest';

import type { FileObject } from '@domain/value-objects/file/file-object.vo';
import { successResult } from '@domain/value-objects/result.vo';

import { PluginPKFFileResolver } from './plugin-pkg-file-resolver.impl';

const zipBuffer = async (entries: { filename: string; buffer: Buffer }[]) => {
  const writer = new ZipWriter(new BlobWriter('application/zip'));

  for (const entry of entries) {
    await writer.add(entry.filename, new Uint8ArrayReader(entry.buffer));
  }

  return Buffer.from(await (await writer.close()).arrayBuffer());
};
const fixturePkgBuffer = () => readFile('test/fixtures/tools/getTime/getTime.pkg');

const createPkgBuffer = async (
  readmeFiles: { filename: string; content: string }[] = []
): Promise<Buffer> =>
  zipBuffer([
    { filename: 'index.js', buffer: Buffer.from('export default {};\n') },
    {
      filename: 'manifest.json',
      buffer: Buffer.from(
        JSON.stringify({
          pluginId: 'readme-demo',
          version: '1.0.0',
          type: 'tool',
          name: { en: 'README demo', 'zh-CN': 'README 示例' },
          icon: 'logo.svg',
          description: { en: 'README demo', 'zh-CN': 'README 示例' },
          toolDescription: 'README demo',
          secretSchema: {}
        })
      )
    },
    ...readmeFiles.map(({ filename, content }) => ({ filename, buffer: Buffer.from(content) }))
  ]);

const fileObject = (fileName: string, buffer: Buffer) =>
  ({
    metaData: {
      fileKey: fileName,
      fileName,
      contentType: 'application/zip',
      size: buffer.length,
      etag: fileName,
      createTime: new Date('2026-01-01T00:00:00Z')
    },
    get fileBuffer() {
      return Promise.resolve(successResult(buffer));
    },
    get fileStream() {
      return Promise.resolve(successResult(Readable.from([buffer])));
    }
  }) as FileObject;

describe('PluginPKFFileResolver.parsePluginPkg', () => {
  it('preserves the legacy single README file', async () => {
    const pkg = await createPkgBuffer([{ filename: 'README.md', content: 'Legacy README' }]);
    const save = vi.fn(async ({ fileName }: { fileName?: string }) =>
      successResult(fileObject(fileName ?? '', Buffer.alloc(0)))
    );
    const resolver = new PluginPKFFileResolver({
      localFileStorageRepo: { save },
      pluginRepo: {
        getPluginFileAccessURL: vi.fn().mockResolvedValue(successResult('https://example.com/readme'))
      }
    } as never);

    const [parsed, err] = await resolver.parsePluginPkg(fileObject('tool.pkg', pkg), false);

    expect(err).toBeNull();
    expect(parsed?.files.readme?.metaData.fileName).toBe('README.md');
    expect(parsed?.files).not.toHaveProperty('readmes');
    expect(save.mock.calls.map(([input]) => input.fileName)).toEqual([
      'index.js',
      'manifest.json',
      'README.md'
    ]);
  });

  it('saves each README variant with its stable filename and locale', async () => {
    const pkg = await createPkgBuffer([
      { filename: 'README.md', content: 'Legacy README' },
      { filename: 'README.en.md', content: 'English README' },
      { filename: 'README.zh-CN.md', content: '简体中文 README' },
      { filename: 'README.zh-Hant.md', content: '繁體中文 README' }
    ]);
    const save = vi.fn(async ({ fileName }: { fileName?: string }) =>
      successResult(fileObject(fileName ?? '', Buffer.alloc(0)))
    );
    const resolver = new PluginPKFFileResolver({
      localFileStorageRepo: { save },
      pluginRepo: {
        getPluginFileAccessURL: vi.fn().mockResolvedValue(successResult('https://example.com/readme'))
      }
    } as never);

    const [parsed, err] = await resolver.parsePluginPkg(fileObject('tool.pkg', pkg), false);

    expect(err).toBeNull();
    expect(parsed?.files.readme?.metaData.fileName).toBe('README.md');
    expect(parsed?.files.readmes).toMatchObject({
      en: { metaData: { fileName: 'README.en.md' } },
      'zh-CN': { metaData: { fileName: 'README.zh-CN.md' } },
      'zh-Hant': { metaData: { fileName: 'README.zh-Hant.md' } }
    });
    expect(parsed?.files.assets).toBeUndefined();
    expect(save.mock.calls.map(([input]) => input.fileName)).toEqual([
      'index.js',
      'manifest.json',
      'README.md',
      'README.en.md',
      'README.zh-CN.md',
      'README.zh-Hant.md'
    ]);
  });

  it('keeps the no-README result shape for older packages', async () => {
    const pkg = await createPkgBuffer();
    const save = vi.fn(async ({ fileName }: { fileName?: string }) =>
      successResult(fileObject(fileName ?? '', Buffer.alloc(0)))
    );
    const resolver = new PluginPKFFileResolver({
      localFileStorageRepo: { save },
      pluginRepo: {}
    } as never);

    const [parsed, err] = await resolver.parsePluginPkg(fileObject('tool.pkg', pkg), false);

    expect(err).toBeNull();
    expect(parsed?.files).not.toHaveProperty('readme');
    expect(parsed?.files).not.toHaveProperty('readmes');
    expect(save.mock.calls.map(([input]) => input.fileName)).toEqual(['index.js', 'manifest.json']);
  });
});

describe('PluginPKFFileResolver.parsePluginZipFiles', () => {
  it('rejects zip packages that contain non-pkg files', async () => {
    const toolPkg = await fixturePkgBuffer();
    const bundle = await zipBuffer([
      {
        filename: 'tool.pkg',
        buffer: toolPkg
      },
      {
        filename: 'README.md',
        buffer: Buffer.from('demo')
      }
    ]);
    const resolver = new PluginPKFFileResolver({
      localFileStorageRepo: {
        save: vi.fn()
      },
      pluginRepo: {}
    } as never);

    const [, err] = await resolver.parsePluginZipFiles(fileObject('bundle.zip', bundle));

    expect(err?.reason.en).toBe('Zip package must contain only .pkg files');
  });

  it('extracts and saves pkg files from a zip package', async () => {
    const firstPkg = await fixturePkgBuffer();
    const secondPkg = await fixturePkgBuffer();
    const savedFirst = fileObject('first.pkg', firstPkg);
    const savedSecond = fileObject('nested/second.pkg', secondPkg);
    const save = vi
      .fn()
      .mockResolvedValueOnce(successResult(savedFirst))
      .mockResolvedValueOnce(successResult(savedSecond));
    const bundle = await zipBuffer([
      {
        filename: 'first.pkg',
        buffer: firstPkg
      },
      {
        filename: 'nested/second.pkg',
        buffer: secondPkg
      }
    ]);
    const resolver = new PluginPKFFileResolver({
      localFileStorageRepo: {
        save
      },
      pluginRepo: {}
    } as never);

    const [files, err] = await resolver.parsePluginZipFiles(fileObject('bundle.zip', bundle));

    expect(err).toBeNull();
    expect(files).toEqual([savedFirst, savedSecond]);
    expect(save).toHaveBeenNthCalledWith(1, {
      file: firstPkg,
      fileKey: expect.any(String),
      fileName: 'first.pkg',
      contentType: 'application/zip',
      overwrite: true
    });
    expect(save).toHaveBeenNthCalledWith(2, {
      file: secondPkg,
      fileKey: expect.any(String),
      fileName: 'nested/second.pkg',
      contentType: 'application/zip',
      overwrite: true
    });
    expect(save.mock.calls[0][0].fileKey).not.toBe(save.mock.calls[1][0].fileKey);
  });
});
