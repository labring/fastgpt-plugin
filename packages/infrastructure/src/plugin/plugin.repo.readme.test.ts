import path from 'node:path';
import { Readable } from 'node:stream';

import { describe, expect, it, vi } from 'vitest';

import type { PluginType } from '@domain/entities/plugin.entity';
import type { PkgContentFileObjects } from '@domain/value-objects/file/pkg-file.vo';
import { successResult } from '@domain/value-objects/result.vo';

import { PluginRepo, type PluginRepoDeps } from './plugin.repo';

const plugin = (): PluginType =>
  ({
    pluginId: 'readme-demo',
    version: '1.0.0',
    etag: 'etag-1',
    type: 'tool',
    name: { en: 'README demo', 'zh-CN': 'README 示例' },
    icon: 'https://example.com/logo.svg',
    description: { en: 'README demo', 'zh-CN': 'README 示例' },
    readmeUrl: 'https://cdn.example.com/README.md',
    readmeUrls: {
      en: 'https://cdn.example.com/README.en.md',
      'zh-CN': 'https://cdn.example.com/README.zh-CN.md'
    },
    toolDescription: 'README demo',
    inputSchema: {},
    outputSchema: {},
    secretSchema: {}
  }) as PluginType;

const fileObject = (fileName: string) => ({
  metaData: {
    fileKey: fileName,
    fileName,
    contentType: 'text/markdown',
    size: fileName.length,
    etag: `${fileName}-etag`,
    createTime: new Date('2026-01-01T00:00:00Z')
  },
  get fileStream() {
    return Promise.resolve(successResult(Readable.from([fileName])));
  }
});

describe('PluginRepo README URL mapping', () => {
  it('persists localized README files and exposes their URL map through plugin storage', async () => {
    (PluginRepo as any)._instance = undefined;

    const readmeFiles = [
      fileObject('README.md'),
      fileObject('README.en.md'),
      fileObject('README.zh-CN.md')
    ];
    const pluginModel = {
      findOne: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
      create: vi.fn().mockImplementation(async (record: unknown) => ({
        toObject: () => ({ ...record as object, _id: 'created-plugin' })
      }))
    };
    const installationModel = {
      findOne: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
      updateOne: vi.fn()
    };
    const publicSave = vi.fn().mockResolvedValue(successResult(fileObject('saved')));
    const repo = PluginRepo.getInstance({
      mongoClient: {
        getModel: vi.fn((modelName: string) =>
          modelName === 'pluginInstallation' ? installationModel : pluginModel
        )
      },
      privateRemoteFileStorageRepo: {
        save: vi.fn().mockResolvedValue(successResult(fileObject('index.js')))
      },
      publicRemoteFileStorageRepo: {
        save: publicSave
      }
    } as unknown as PluginRepoDeps);

    const [result, error] = await repo.createPlugin({
      plugin: plugin(),
      files: {
        index: fileObject('index.js'),
        manifest: fileObject('manifest.json'),
        readme: readmeFiles[0],
        readmes: {
          en: readmeFiles[1],
          'zh-CN': readmeFiles[2]
        }
      } as unknown as PkgContentFileObjects,
      pending: true
    });

    expect(error).toBeNull();
    expect(result).toEqual({ runtimeRegistrationRequired: false });
    expect(publicSave.mock.calls.map(([input]) => input.fileKey)).toEqual(
      readmeFiles.map((file) => path.join('readme-demo', '1.0.0', 'etag-1', file.metaData.fileName))
    );
    expect(pluginModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        readmeUrl: 'https://cdn.example.com/README.md',
        readmeUrls: {
          en: 'https://cdn.example.com/README.en.md',
          'zh-CN': 'https://cdn.example.com/README.zh-CN.md'
        }
      })
    );
  });
});
