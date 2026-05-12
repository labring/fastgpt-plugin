import { describe, expect, it } from 'vitest';

import { ToolGetParamsDTOSchema } from './tool.dto';

describe('ToolGetParamsDTOSchema', () => {
  it('parses fallbackLatestVersion from URL query strings', () => {
    expect(
      ToolGetParamsDTOSchema.parse({
        pluginId: 'getTime',
        fallbackLatestVersion: 'true'
      }).fallbackLatestVersion
    ).toBe(true);

    expect(
      ToolGetParamsDTOSchema.parse({
        pluginId: 'getTime',
        fallbackLatestVersion: 'false'
      }).fallbackLatestVersion
    ).toBe(false);
  });

  it('keeps boolean fallbackLatestVersion for SDK callers', () => {
    const query = ToolGetParamsDTOSchema.parse({
      pluginId: 'getTime',
      fallbackLatestVersion: true
    });

    expect(query.fallbackLatestVersion).toBe(true);
  });
});
