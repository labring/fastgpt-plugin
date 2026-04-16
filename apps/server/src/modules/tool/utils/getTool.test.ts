import type { ToolSetType,ToolType } from '@fastgpt-plugin/helpers/tools/schemas/tool';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCachedData } from '@/lib/cache';
import { SystemCacheKeyEnum } from '@/lib/cache/type';

import { getTool } from '../tool';

vi.mock('@/lib/cache', () => ({
  getCachedData: vi.fn()
}));

describe('getTool', () => {
  const mockToolMap = new Map();

  beforeEach(() => {
    mockToolMap.clear();
    vi.mocked(getCachedData).mockResolvedValue(mockToolMap);
  });

  it('should return tool by baseToolId', async () => {
    const mockTool: ToolType = {
      toolId: 'FastGPT@getTime',
      name: { en: 'Get Time' },
      description: { en: 'Get current time' },
      toolDescription: 'Get current time',
      icon: 'icon.png',
      handler: vi.fn(),
      filename: 'getTime.js',
      versionList: [
        { value: '1.0.0', etag: 'etag1' },
        { value: '1.1.0', etag: 'etag2' }
      ]
    };

    mockToolMap.set('FastGPT@getTime', mockTool);

    const result = await getTool('FastGPT@getTime');

    expect(result).toBeDefined();
    expect(result?.toolId).toBe('FastGPT@getTime');
    expect(result?.versionList).toHaveLength(2);
  });

  it('should filter versionList by version parameter', async () => {
    const mockTool: ToolType = {
      toolId: 'FastGPT@getTime',
      name: { en: 'Get Time' },
      description: { en: 'Get current time' },
      toolDescription: 'Get current time',
      icon: 'icon.png',
      handler: vi.fn(),
      filename: 'getTime.js',
      versionList: [
        { value: '1.0.0', etag: 'etag1' },
        { value: '1.1.0', etag: 'etag2' },
        { value: '2.0.0', etag: 'etag3' }
      ]
    };

    mockToolMap.set('FastGPT@getTime', mockTool);

    const result = await getTool('FastGPT@getTime', '1.1.0');

    expect(result).toBeDefined();
    expect(result?.versionList).toHaveLength(1);
    expect(result?.versionList?.[0].value).toBe('1.1.0');
  });

  it('should return undefined if version not found', async () => {
    const mockTool: ToolType = {
      toolId: 'FastGPT@getTime',
      name: { en: 'Get Time' },
      description: { en: 'Get current time' },
      toolDescription: 'Get current time',
      icon: 'icon.png',
      handler: vi.fn(),
      filename: 'getTime.js',
      versionList: [{ value: '1.0.0', etag: 'etag1' }]
    };

    mockToolMap.set('FastGPT@getTime', mockTool);

    const result = await getTool('FastGPT@getTime', '2.0.0');

    expect(result).toBeUndefined();
  });

  it('should return child tool from toolset', async () => {
    const mockToolset: ToolSetType = {
      toolId: 'FastGPT@dbops',
      name: { en: 'DB Operations' },
      description: { en: 'Database operations' },
      toolDescription: 'Database operations',
      icon: 'icon.png',
      filename: 'dbops.js',
      children: [
        {
          toolId: 'FastGPT@dbops/mysql',
          name: { en: 'MySQL' },
          description: { en: 'MySQL operations' },
          toolDescription: 'MySQL operations',
          icon: 'mysql.png',
          handler: vi.fn(),
          filename: 'dbops.js',
          versionList: [{ value: '1.0.0', etag: 'etag1' }]
        },
        {
          toolId: 'FastGPT@dbops/postgresql',
          name: { en: 'PostgreSQL' },
          description: { en: 'PostgreSQL operations' },
          toolDescription: 'PostgreSQL operations',
          icon: 'pg.png',
          handler: vi.fn(),
          filename: 'dbops.js',
          versionList: [{ value: '1.0.0', etag: 'etag1' }]
        }
      ]
    };

    mockToolMap.set('FastGPT@dbops', mockToolset);

    const result = await getTool('FastGPT@dbops/mysql');

    expect(result).toBeDefined();
    expect(result?.toolId).toBe('FastGPT@dbops/mysql');
  });

  it('should filter child tool versionList by version', async () => {
    const mockToolset: ToolSetType = {
      toolId: 'FastGPT@dbops',
      name: { en: 'DB Operations' },
      description: { en: 'Database operations' },
      toolDescription: 'Database operations',
      icon: 'icon.png',
      filename: 'dbops.js',
      children: [
        {
          toolId: 'FastGPT@dbops/mysql',
          name: { en: 'MySQL' },
          description: { en: 'MySQL operations' },
          toolDescription: 'MySQL operations',
          icon: 'mysql.png',
          handler: vi.fn(),
          filename: 'dbops.js',
          versionList: [
            { value: '1.0.0', etag: 'etag1' },
            { value: '1.1.0', etag: 'etag2' }
          ]
        }
      ]
    };

    mockToolMap.set('FastGPT@dbops', mockToolset);

    const result = await getTool('FastGPT@dbops/mysql', '1.1.0');

    expect(result).toBeDefined();
    expect(result?.versionList).toHaveLength(1);
    expect(result?.versionList?.[0].value).toBe('1.1.0');
  });

  it('should return undefined if tool not found', async () => {
    const result = await getTool('NonExistent@tool');

    expect(result).toBeUndefined();
  });

  it('should return undefined if child tool not found in toolset', async () => {
    const mockToolset: ToolSetType = {
      toolId: 'FastGPT@dbops',
      name: { en: 'DB Operations' },
      description: { en: 'Database operations' },
      toolDescription: 'Database operations',
      icon: 'icon.png',
      filename: 'dbops.js',
      children: [
        {
          toolId: 'FastGPT@dbops/mysql',
          name: { en: 'MySQL' },
          description: { en: 'MySQL operations' },
          toolDescription: 'MySQL operations',
          icon: 'mysql.png',
          handler: vi.fn(),
          filename: 'dbops.js',
          versionList: [{ value: '1.0.0', etag: 'etag1' }]
        }
      ]
    };

    mockToolMap.set('FastGPT@dbops', mockToolset);

    const result = await getTool('FastGPT@dbops/nonexistent');

    expect(result).toBeUndefined();
  });
});
