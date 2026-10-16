import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { findReadmeFiles } from './readme-files';

describe('findReadmeFiles', () => {
  let directory: string | undefined;

  afterEach(async () => {
    if (directory) await rm(directory, { recursive: true, force: true });
    directory = undefined;
  });

  it('rejects README variants nested in packaged assets', async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'plugin-readme-'));
    const assets = path.join(directory, 'assets');
    await mkdir(assets);
    await writeFile(path.join(directory, 'README.en.md'), 'English');
    await writeFile(path.join(assets, 'README.fr.md'), 'Unsupported');

    await expect(findReadmeFiles(directory)).rejects.toThrow(/assets\/README\.fr\.md/);
  });
});
