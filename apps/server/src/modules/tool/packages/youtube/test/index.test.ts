import { expect, test } from 'vitest';
import tool from '..';

test('YouTube toolset configuration', async () => {
  expect(tool.name).toBeDefined();
  expect(tool.description).toBeDefined();
  expect(tool.tags).toContain('entertainment');

  // Check that toolset has proper i18n support
  expect(tool.name['zh-CN']).toBe('YouTube 工具集');
  expect(tool.name['en']).toBe('YouTube Tools');
  expect(tool.description['zh-CN']).toContain('YouTube 视频');
  expect(tool.description['en']).toContain('YouTube video');
});
