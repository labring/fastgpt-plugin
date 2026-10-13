import fs from 'node:fs/promises';
import path from 'node:path';

const README_FILE_NAMES = [
  'README.md',
  'README.en.md',
  'README.zh-CN.md',
  'README.zh-Hant.md'
] as const;

const README_CANDIDATE_PATTERN = /^readme(?:[._-].+)?\.md$/i;
const CANONICAL_NAME_BY_NORMALIZED_NAME = new Map(
  README_FILE_NAMES.map((fileName) => [fileName.toLowerCase(), fileName])
);
const README_LOCALE_BY_NAME = new Map<string, string>([
  ['README.en.md', 'en'],
  ['README.zh-CN.md', 'zh-CN'],
  ['README.zh-Hant.md', 'zh-Hant']
]);

/**
 * Validates README filenames from a plugin project and returns the recognized files.
 * Only canonical, supported filenames are accepted so package behavior is portable
 * across case-sensitive and case-insensitive filesystems.
 */
export function validateReadmeFileNames(fileNames: string[]): string[] {
  const candidates = fileNames.filter((fileName) => README_CANDIDATE_PATTERN.test(fileName));
  const canonicalNames = candidates.map((fileName) =>
    CANONICAL_NAME_BY_NORMALIZED_NAME.get(fileName.toLowerCase())
  );
  const localeCounts = new Map<string, number>();

  for (const canonicalName of canonicalNames) {
    if (!canonicalName || canonicalName === 'README.md') continue;
    const locale = README_LOCALE_BY_NAME.get(canonicalName);
    if (locale) localeCounts.set(locale, (localeCounts.get(locale) ?? 0) + 1);
  }

  for (const [locale, count] of localeCounts) {
    if (count > 1) {
      throw new Error(`Duplicate README locale "${locale}". Provide only one README variant per locale.`);
    }
  }

  for (let index = 0; index < candidates.length; index += 1) {
    const fileName = candidates[index];
    const canonicalName = canonicalNames[index];
    if (canonicalName !== fileName) {
      throw new Error(
        `Invalid README filename "${fileName}". Use README.md, README.en.md, README.zh-CN.md, or README.zh-Hant.md.`
      );
    }
  }

  return candidates;
}

export async function findReadmeFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return validateReadmeFileNames(
    entries.filter((entry) => entry.isFile()).map((entry) => entry.name)
  );
}

export function resolveReadmeFilePath(directory: string, fileName: string): string {
  return path.join(directory, fileName);
}
