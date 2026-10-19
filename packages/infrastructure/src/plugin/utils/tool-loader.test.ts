import { describe, expect, it, vi } from 'vitest';

import { successResult } from '@domain/value-objects/result.vo';

import { loadPlugin } from './tool-loader';

const manifest = JSON.stringify({
  pluginId: 'readme-demo',
  version: '1.0.0',
  type: 'tool',
  name: { en: 'README demo', 'zh-CN': 'README 示例' },
  icon: 'logo.svg',
  description: { en: 'README demo', 'zh-CN': 'README 示例' },
  toolDescription: 'README demo',
  secretSchema: {},
  inputSchema: {},
  outputSchema: {}
});

const load = (availableFiles: string[]) => {
  const getAccessURL = vi.fn(async ({ filePath }: { filePath: string[] }) =>
    successResult(`https://example.com/${filePath.join('/')}`)
  );

  return loadPlugin({
    manifest,
    etag: 'etag-1',
    availableFiles,
    getAccessURL
  }).then(([plugin, error]) => ({ plugin, error, getAccessURL }));
};

describe('loadPlugin README URLs', () => {
  it('retains legacy tool descriptions in plugin manifests', async () => {
    const { plugin, error } = await load([
      'logo.svg',
      'README.md',
      'README.en.md',
      'README.zh-CN.md'
    ]);

    expect(error).toBeNull();
    expect(plugin?.description).toEqual({ en: 'README demo', 'zh-CN': 'README 示例' });
    expect(plugin?.toolDescription).toBe('README demo');
  });

  it('maps only present localized README URLs while retaining the legacy URL', async () => {
    const { plugin, error, getAccessURL } = await load([
      'logo.svg',
      'README.md',
      'README.en.md',
      'README.zh-CN.md'
    ]);

    expect(error).toBeNull();
    expect(plugin?.readmeUrls).toEqual({
      en: 'https://example.com/README.en.md',
      'zh-CN': 'https://example.com/README.zh-CN.md'
    });
    expect(plugin?.readmeUrl).toBe('https://example.com/README.md');
    expect(getAccessURL).toHaveBeenCalledWith({
      pluginId: 'readme-demo',
      version: '1.0.0',
      filePath: ['README.en.md']
    });
    expect(getAccessURL).toHaveBeenCalledWith({
      pluginId: 'readme-demo',
      version: '1.0.0',
      filePath: ['README.zh-CN.md']
    });
  });

  it('uses en, then zh-CN, then zh-Hant for the legacy URL when README.md is absent', async () => {
    const { plugin, error } = await load([
      'logo.svg',
      'README.en.md',
      'README.zh-CN.md',
      'README.zh-Hant.md'
    ]);

    expect(error).toBeNull();
    expect(plugin?.readmeUrls).toEqual({
      en: 'https://example.com/README.en.md',
      'zh-CN': 'https://example.com/README.zh-CN.md',
      'zh-Hant': 'https://example.com/README.zh-Hant.md'
    });
    expect(plugin?.readmeUrl).toBe('https://example.com/README.en.md');
  });

  it('keeps old packages that have only README.md compatible', async () => {
    const { plugin, error } = await load(['logo.svg', 'README.md']);

    expect(error).toBeNull();
    expect(plugin?.readmeUrl).toBe('https://example.com/README.md');
    expect(plugin).not.toHaveProperty('readmeUrls');
  });

  it('does not invent readme URLs for packages without a README', async () => {
    const { plugin, error, getAccessURL } = await load(['logo.svg']);

    expect(error).toBeNull();
    expect(plugin).not.toHaveProperty('readmeUrl');
    expect(plugin).not.toHaveProperty('readmeUrls');
    expect(getAccessURL).not.toHaveBeenCalledWith(expect.objectContaining({ filePath: ['README.md'] }));
  });
});
