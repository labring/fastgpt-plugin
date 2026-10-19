const README_FILE_NAMES: Record<string, true> = {
  'README.md': true,
  'README.en.md': true,
  'README.zh-CN.md': true,
  'README.zh-Hant.md': true
};
const README_CANDIDATE_PATTERN = /^README(?:[._-].*)?\.md$/i;
const README_LOCALE_BY_NAME: Record<string, string> = {
  'README.en.md': 'en',
  'README.zh-CN.md': 'zh-CN',
  'README.zh-Hant.md': 'zh-Hant'
};

export type ReadmeFilenameValidation =
  | { valid: true; fileNames: string[] }
  | { valid: false; error: string };

export function validatePluginReadmeFilenames(fileNames: readonly string[]): ReadmeFilenameValidation {
  const candidates = fileNames.filter((fileName) =>
    README_CANDIDATE_PATTERN.test(fileName.split(/[\\/]/).at(-1) ?? '')
  );
  const locales = new Set<string>();
  const names = new Set<string>();

  for (const fileName of candidates) {
    const basename = fileName.split(/[\\/]/).at(-1) ?? '';
    if (fileName !== basename) {
      return { valid: false, error: `README files must be in the package root: ${fileName}` };
    }
    if (!Object.hasOwn(README_FILE_NAMES, fileName)) {
      return { valid: false, error: `Unsupported or non-canonical README filename: ${fileName}` };
    }
    if (names.has(fileName)) {
      return { valid: false, error: `Duplicate README filename: ${fileName}` };
    }
    names.add(fileName);

    const locale = README_LOCALE_BY_NAME[fileName];
    if (locale && locales.has(locale)) {
      return { valid: false, error: `Duplicate README locale: ${locale}` };
    }
    if (locale) locales.add(locale);
  }

  return { valid: true, fileNames: candidates };
}
