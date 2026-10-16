import { describe, expect, it } from 'vitest';

import { validatePluginReadmeFilenames } from './readme-filenames.vo';

describe('validatePluginReadmeFilenames', () => {
  it('accepts canonical root README variants', () => {
    expect(
      validatePluginReadmeFilenames([
        'README.md',
        'README.en.md',
        'README.zh-CN.md',
        'README.zh-Hant.md',
        'index.js'
      ])
    ).toEqual({
      valid: true,
      fileNames: ['README.md', 'README.en.md', 'README.zh-CN.md', 'README.zh-Hant.md']
    });
  });

  it('rejects non-canonical, duplicate, and nested README variants', () => {
    expect(validatePluginReadmeFilenames(['README.fr.md'])).toMatchObject({ valid: false });
    expect(validatePluginReadmeFilenames(['README.en.md', 'README.en.md'])).toMatchObject({
      valid: false
    });
    expect(validatePluginReadmeFilenames(['assets/README.md'])).toMatchObject({ valid: false });
    expect(validatePluginReadmeFilenames(['README.zh-cn.md'])).toMatchObject({ valid: false });
  });
});
