import { createHash } from 'node:crypto';
import path from 'node:path';
import type { Readable } from 'node:stream';

import type { PluginType } from '@domain/entities/plugin.entity';
import {
  detectMimeTypeFromContent,
  getMimeTypeFromFilename,
  type MIMEType
} from '@domain/value-objects/file/MIME.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';

import { bufferToReadable, readStreamToBuffer, unpkg } from './pkg';
import { loadPlugin } from './tool-loader';

const IMAGE_CONTENT_TYPES = new Set<MIMEType>([
  'image/svg+xml',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp'
]);

export type ParsedPkgFile = {
  filename: string;
  contentType: MIMEType;
  size: number;
  stream: Readable;
};

export type ParsedPkgFiles = {
  index: ParsedPkgFile;
  manifest: ParsedPkgFile;
  readme?: ParsedPkgFile;
  assets?: ParsedPkgFile[];
  logos?: ParsedPkgFile[];
};

export type ParsePkgParams = {
  input: Buffer | Readable;
  getAccessURL?: (arg: {
    pluginId: string;
    version: string;
    filePath: string[];
    etag: string;
  }) => Promise<Result<string>>;
};

const ensureBuffer = async (input: Buffer | Readable): Promise<Result<Buffer>> => {
  if (Buffer.isBuffer(input)) {
    return successResult(input);
  }

  return readStreamToBuffer(input);
};

const getContentType = (filename: string, buffer: Buffer): MIMEType => {
  return detectMimeTypeFromContent(
    buffer,
    getMimeTypeFromFilename(filename) ?? 'application/octet-stream'
  );
};

const createParsedPkgFile = (filename: string, buffer: Buffer): ParsedPkgFile => ({
  filename,
  contentType: getContentType(filename, buffer),
  size: buffer.length,
  stream: bufferToReadable(buffer)
});

type PkgFileEntry = {
  filename: string;
  buffer: Buffer;
};

const md5 = (input: string | Buffer): string => createHash('md5').update(input).digest('hex');

const getPkgEtag = (files: PkgFileEntry[]): string => {
  const hash = createHash('md5');
  const sortedFiles = [...files].sort((a, b) => {
    if (a.filename < b.filename) return -1;
    if (a.filename > b.filename) return 1;
    return 0;
  });

  for (const file of sortedFiles) {
    hash.update(file.filename);
    hash.update('\0');
    hash.update(md5(file.buffer));
    hash.update('\0');
    hash.update(String(file.buffer.length));
    hash.update('\n');
  }

  return hash.digest('hex').slice(0, 8);
};

export const parsePkg = async ({
  input,
  getAccessURL
}: ParsePkgParams): Promise<Result<{ info: PluginType; files: ParsedPkgFiles }>> => {
  const [pkgBuffer, pkgBufferErr] = await ensureBuffer(input);

  if (pkgBufferErr) {
    return failureResult(
      {
        en: 'Failed to read plugin package',
        'zh-CN': '读取插件包失败'
      },
      pkgBufferErr
    );
  }

  const entries = await unpkg(bufferToReadable(pkgBuffer));
  const fileEntries: PkgFileEntry[] = [];

  for (const entry of entries) {
    if (entry.directory || !entry.stream) continue;

    const [buffer, bufferErr] = await readStreamToBuffer(entry.stream);
    if (bufferErr) {
      return failureResult(
        {
          en: `Failed to read extracted file: ${entry.filename}`,
          'zh-CN': `读取解压文件失败: ${entry.filename}`
        },
        bufferErr
      );
    }

    fileEntries.push({
      filename: entry.filename,
      buffer
    });
  }

  const etag = getPkgEtag(fileEntries);
  const availableFiles = fileEntries.map((entry) => entry.filename);

  let index: ParsedPkgFile | undefined;
  let manifest: ParsedPkgFile | undefined;
  let manifestText: string | undefined;
  let readme: ParsedPkgFile | undefined;
  const assets: ParsedPkgFile[] = [];
  const logos: ParsedPkgFile[] = [];

  for (const entry of fileEntries) {
    const file = createParsedPkgFile(entry.filename, entry.buffer);

    if (entry.filename === 'index.js') {
      index = file;
      continue;
    }

    if (entry.filename === 'manifest.json') {
      manifest = file;
      manifestText = entry.buffer.toString();
      continue;
    }

    if (entry.filename === 'README.md') {
      readme = file;
      continue;
    }

    if (path.dirname(entry.filename) === 'assets' && IMAGE_CONTENT_TYPES.has(file.contentType)) {
      assets.push(file);
      continue;
    }

    if (
      path.dirname(entry.filename) === '.' &&
      /^([^.]+\.|)logo\./i.test(path.basename(entry.filename)) &&
      IMAGE_CONTENT_TYPES.has(file.contentType)
    ) {
      logos.push(file);
    }
  }

  if (!index) {
    return failureResult({
      en: 'Missing index.js in plugin package',
      'zh-CN': '插件包缺少 index.js'
    });
  }

  if (!manifest) {
    return failureResult({
      en: 'Missing manifest.json in plugin package',
      'zh-CN': '插件包缺少 manifest.json'
    });
  }

  const [info, infoErr] = await loadPlugin({
    manifest: manifestText ?? '',
    etag,
    availableFiles,
    getAccessURL: getAccessURL
      ? async ({ filePath, pluginId, version }) =>
          getAccessURL({
            filePath,
            pluginId,
            version,
            etag
          })
      : undefined
  });

  if (infoErr) {
    return failureResult(
      {
        en: 'Can not load plugin',
        'zh-CN': '无法加载插件'
      },
      infoErr
    );
  }

  return successResult({
    info,
    files: {
      index,
      manifest,
      ...(readme ? { readme } : {}),
      ...(assets.length ? { assets } : {}),
      ...(logos.length ? { logos } : {})
    }
  });
};
