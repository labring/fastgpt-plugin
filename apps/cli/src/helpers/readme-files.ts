import fs from 'node:fs/promises';
import path from 'node:path';

import { validatePluginReadmeFilenames } from '@domain/value-objects/plugin/readme-filenames.vo';

/** Validates README names with the same rules used by the server package parser. */
export function validateReadmeFileNames(fileNames: string[]): string[] {
  const result = validatePluginReadmeFilenames(fileNames);
  if (!result.valid) throw new Error(result.error);
  return result.fileNames;
}

export async function findReadmeFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const rootFiles = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const assetFiles = await listFilesRecursively(path.join(directory, 'assets'), 'assets').catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  );

  validateReadmeFileNames([...rootFiles, ...assetFiles]);
  return validateReadmeFileNames(rootFiles);
}

async function listFilesRecursively(directory: string, prefix: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursively(path.join(directory, entry.name), relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }
  return files;
}

export function resolveReadmeFilePath(directory: string, fileName: string): string {
  return path.join(directory, fileName);
}
