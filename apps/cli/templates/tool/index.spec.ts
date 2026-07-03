import { describe, expect, it } from 'vitest';

import plugin from './index';

describe('plugin template', () => {
  it('exports a valid FastGPT plugin manifest', () => {
    const manifest = plugin.getUserToolManifest();

    expect(manifest.pluginId).toBeTruthy();
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(manifest.name).toBeDefined();
    expect(manifest.description).toBeDefined();
  });
});
