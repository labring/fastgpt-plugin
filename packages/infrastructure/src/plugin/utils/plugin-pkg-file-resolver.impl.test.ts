import { readFile } from 'node:fs/promises';

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
    }
  }) as FileObject;

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
