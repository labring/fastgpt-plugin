#!/usr/bin/env node

import * as fs from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const ZIP_MIME_TYPE = 'application/zip';

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  validateRequiredOptions(options);

  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const file = await validateZipFile(options.filePath);
  const uploadUrl = buildApiUrl(baseUrl, '/api/plugin/upload');
  const confirmUrl = buildApiUrl(baseUrl, '/api/plugin/confirm');

  console.log(`Uploading file: ${file.path}`);
  const uploadPayload = await uploadZip({
    url: uploadUrl,
    token: options.token,
    file
  });
  const uploadResult = unwrapData(uploadPayload);
  const failures = getUploadFailures(uploadResult);

  if (failures.length > 0 && !options.allowPartial) {
    throw new Error(
      [
        'Upload returned failed items. Confirm has been skipped.',
        'Pass --allow-partial to confirm successful items anyway.',
        formatFailures(failures)
      ].join('\n')
    );
  }

  if (failures.length > 0) {
    console.warn(`Upload returned failed items. Confirming successful items:\n${formatFailures(failures)}`);
  }

  const uniqueIds = extractUniqueIds(uploadResult);

  if (uniqueIds.length === 0) {
    throw new Error('Upload response contains no confirmable plugins[].pluginId/version/etag.');
  }

  console.log(`Parsed ${uniqueIds.length} plugin(s). Confirming...`);
  await confirmPlugins({
    url: confirmUrl,
    token: options.token,
    uniqueIds
  });

  console.log('Confirm completed:');
  console.log(JSON.stringify({ uniqueIds }, null, 2));
}

function parseArgs(args) {
  const options = {
    allowPartial: false,
    baseUrl: undefined,
    token: undefined,
    filePath: undefined,
    help: false
  };
  const positional = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--allow-partial') {
      options.allowPartial = true;
      continue;
    }

    if (arg.startsWith('--')) {
      const { key, value, nextIndex } = readLongOption(args, index);
      index = nextIndex;

      switch (key) {
        case 'baseurl':
        case 'base-url':
          options.baseUrl = value;
          break;
        case 'token':
        case 'auth-token':
          options.token = value;
          break;
        case 'file':
        case 'zip':
        case 'zip-file':
          options.filePath = value;
          break;
        default:
          throw new Error(`Unknown option: --${key}`);
      }

      continue;
    }

    if (arg.startsWith('-')) {
      const value = args[index + 1];
      if (!value || value.startsWith('-')) {
        throw new Error(`Missing value for ${arg}.`);
      }

      switch (arg) {
        case '-b':
          options.baseUrl = value;
          break;
        case '-t':
          options.token = value;
          break;
        case '-f':
          options.filePath = value;
          break;
        default:
          throw new Error(`Unknown option: ${arg}`);
      }

      index += 1;
      continue;
    }

    positional.push(arg);
  }

  if (!options.baseUrl && positional[0]) {
    options.baseUrl = positional[0];
  }
  if (!options.token && positional[1]) {
    options.token = positional[1];
  }
  if (!options.filePath && positional[2]) {
    options.filePath = positional[2];
  }
  if (positional.length > 3) {
    throw new Error(`Unexpected positional arguments: ${positional.slice(3).join(' ')}`);
  }

  return options;
}

function readLongOption(args, index) {
  const arg = args[index];
  const equalIndex = arg.indexOf('=');

  if (equalIndex > -1) {
    return {
      key: arg.slice(2, equalIndex),
      value: arg.slice(equalIndex + 1),
      nextIndex: index
    };
  }

  const value = args[index + 1];
  if (!value || value.startsWith('-')) {
    throw new Error(`Missing value for ${arg}.`);
  }

  return {
    key: arg.slice(2),
    value,
    nextIndex: index + 1
  };
}

function validateRequiredOptions(options) {
  const missing = [];

  if (!options.baseUrl) missing.push('baseurl');
  if (!options.token) missing.push('token');
  if (!options.filePath) missing.push('file');

  if (missing.length > 0) {
    throw new Error(`Missing required options: ${missing.join(', ')}\n\n${usageText()}`);
  }
}

function normalizeBaseUrl(value) {
  try {
    const url = new URL(value);

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('baseurl only supports http or https.');
    }

    url.hash = '';
    url.search = '';

    return url.toString().replace(/\/+$/, '');
  } catch (error) {
    if (error instanceof Error && error.message.includes('baseurl')) {
      throw error;
    }

    throw new Error(`Invalid baseurl: ${value}`);
  }
}

function buildApiUrl(baseUrl, routePath) {
  const base = new URL(baseUrl);
  const basePath = base.pathname.replace(/\/+$/, '');
  const cleanRoutePath = routePath.replace(/^\/+/, '');
  const relativePath =
    basePath.endsWith('/api') && cleanRoutePath.startsWith('api/')
      ? cleanRoutePath.slice('api/'.length)
      : cleanRoutePath;

  base.pathname = `${basePath}/`;
  return new URL(relativePath, base.toString()).toString();
}

async function validateZipFile(filePath) {
  const resolvedPath = path.resolve(filePath);
  const stats = await stat(resolvedPath).catch((error) => {
    throw new Error(`Unable to read file: ${resolvedPath}\n${error.message}`);
  });

  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${resolvedPath}`);
  }

  if (stats.size === 0) {
    throw new Error(`Zip file is empty: ${resolvedPath}`);
  }

  if (path.extname(resolvedPath).toLowerCase() !== '.zip') {
    throw new Error(`Only .zip files are supported: ${resolvedPath}`);
  }

  return {
    path: resolvedPath,
    name: path.basename(resolvedPath),
    size: stats.size
  };
}

async function uploadZip({ url, token, file }) {
  const formData = new FormData();
  const fileBlob = await createFileBlob(file.path);

  formData.append('files', fileBlob, file.name);

  return requestJson(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });
}

async function createFileBlob(filePath) {
  if (typeof Blob === 'undefined') {
    throw new Error('Blob is not available. Use Node.js 18 or newer.');
  }

  if (typeof fs.openAsBlob === 'function') {
    return fs.openAsBlob(filePath, { type: ZIP_MIME_TYPE });
  }

  const buffer = await readFile(filePath);
  return new Blob([buffer], { type: ZIP_MIME_TYPE });
}

async function confirmPlugins({ url, token, uniqueIds }) {
  await requestJson(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ uniqueIds })
  });
}

async function requestJson(url, init) {
  if (typeof fetch !== 'function') {
    throw new Error('fetch is not available. Use Node.js 18 or newer.');
  }

  const response = await fetch(url, init);
  const payload = await readResponsePayload(response);

  if (!response.ok) {
    const message = extractErrorMessage(payload) ?? `${response.status} ${response.statusText}`;
    throw new Error(`Request failed ${response.status}: ${message}`);
  }

  return payload;
}

async function readResponsePayload(response) {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function unwrapData(payload) {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }

  return payload;
}

function getUploadFailures(uploadResult) {
  if (
    uploadResult &&
    typeof uploadResult === 'object' &&
    Array.isArray(uploadResult.failed)
  ) {
    return uploadResult.failed;
  }

  return [];
}

function extractUniqueIds(uploadResult) {
  if (
    !uploadResult ||
    typeof uploadResult !== 'object' ||
    !Array.isArray(uploadResult.plugins)
  ) {
    throw new Error('Unexpected upload response: missing plugins array.');
  }

  const uniqueIds = uploadResult.plugins.map((plugin) => ({
    pluginId: plugin?.pluginId,
    version: plugin?.version,
    etag: plugin?.etag
  }));
  const invalidItem = uniqueIds.find(
    (item) =>
      typeof item.pluginId !== 'string' ||
      typeof item.version !== 'string' ||
      typeof item.etag !== 'string'
  );

  if (invalidItem) {
    throw new Error(
      `Upload response contains an incomplete plugin unique id: ${JSON.stringify(invalidItem)}`
    );
  }

  return uniqueIds;
}

function extractErrorMessage(payload) {
  if (payload == null) {
    return undefined;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (typeof payload !== 'object') {
    return String(payload);
  }

  if ('error' in payload) {
    return extractErrorMessage(payload.error);
  }

  if ('msg' in payload) {
    return extractErrorMessage(payload.msg);
  }

  if ('message' in payload) {
    return extractErrorMessage(payload.message);
  }

  if (typeof payload['zh-CN'] === 'string') {
    return payload['zh-CN'];
  }

  if (typeof payload.en === 'string') {
    return payload.en;
  }

  return JSON.stringify(payload);
}

function formatFailures(failures) {
  return failures
    .map((failure, index) => {
      const fileName = failure?.fileName ? `${failure.fileName}: ` : '';
      const reason = extractErrorMessage(failure?.reason) ?? JSON.stringify(failure);
      return `${index + 1}. ${fileName}${reason}`;
    })
    .join('\n');
}

function printUsage() {
  console.log(usageText());
}

function usageText() {
  return [
    'Usage:',
    '  node scripts/upload-plugin-zip-and-confirm.mjs --baseurl <url> --token <token> --file <zip>',
    '  node scripts/upload-plugin-zip-and-confirm.mjs <baseurl> <token> <zip>',
    '',
    'Options:',
    '  --baseurl, --base-url, -b      FastGPT Plugin service URL, e.g. http://localhost:3020',
    '  --token, --auth-token, -t      API auth token',
    '  --file, --zip, --zip-file, -f  .zip file to upload',
    '  --allow-partial                Confirm successful items even when upload returns failures',
    '',
    'Example:',
    '  node scripts/upload-plugin-zip-and-confirm.mjs -b http://localhost:3020 -t token -f official-system-plugins.zip'
  ].join('\n');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
