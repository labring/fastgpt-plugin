import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { ensureDebugImportHooks } from '@fastgpt-plugin/cli/debug/import-hooks';
import z from 'zod';

import { InvokeMethodEnum } from '@domain/ports/invoke.port';
import { successResult } from '@domain/value-objects/result.vo';
import { StreamData } from '@domain/value-objects/stream.vo';
import { SystemVarSchema, type SystemVarType } from '@domain/value-objects/system-var.vo';
import { ToolStreamMessageSchema, type ToolStreamMessageType } from '@domain/value-objects/tool.vo';

import {
  createLocalDebugRuntime,
  type LocalDebugHostRequestContext,
  type LocalDebugRuntime,
  setCurrentLocalDebugRuntime
} from './runtime';

type PackableToolHandler = {
  inputSchema: z.ZodType<any>;
  outputSchema: z.ZodType<any>;
};

type PackableToolChild = {
  id: string;
  description: Record<string, unknown>;
  name: Record<string, unknown>;
  icon?: string;
  toolDescription?: string;
};

type PackableToolExport = {
  getUserToolManifest(): Record<string, unknown>;
  getSecretSchema(): z.ZodType<any>;
  getToolHandler(childId?: string): PackableToolHandler | undefined;
  getChildManifests(): PackableToolChild[];
};

export type DebugToolSnapshot = {
  id: string;
  name: string;
  description: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
};

export type DebugPluginSnapshot = {
  entryDir: string;
  indexPath: string;
  pluginId: string;
  version: string;
  name: string;
  description: string;
  toolDescription: string;
  author?: string;
  tags?: string[];
  permissions?: string[];
  secretSchema: Record<string, unknown>;
  isToolSet: boolean;
  tools: DebugToolSnapshot[];
};

export type LoadDebugSessionResult = {
  runtime: LocalDebugRuntime;
  snapshot: DebugPluginSnapshot;
  uploadDir: string;
};

export type DebugToolRunResult = {
  systemVar: SystemVarType;
  response?: Record<string, unknown>;
  error?: string;
  streamMessages: ToolStreamMessageType[];
};

export async function loadDebugSession({
  entryDir,
  uploadDir
}: {
  entryDir: string;
  uploadDir: string;
}): Promise<LoadDebugSessionResult> {
  const resolvedEntryDir = path.resolve(entryDir);
  const indexPath = path.join(resolvedEntryDir, 'index.ts');

  await assertPathExists(resolvedEntryDir, `调试目录不存在: ${resolvedEntryDir}`);
  await assertPathExists(indexPath, `找不到 index.ts: ${indexPath}`);

  ensureDebugImportHooks();

  const runtime = createLocalDebugRuntime();
  runtime.setHostRequestHandler(createVirtualHostHandler(uploadDir));

  const previousRuntimeMode = process.env.RUNTIME_MODE;
  process.env.RUNTIME_MODE = 'dev';
  setCurrentLocalDebugRuntime(runtime);

  try {
    const moduleUrl = `${pathToFileURL(indexPath).href}#fastgpt-plugin-debug-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;
    const mod = await import(moduleUrl);
    const tool = mod.default;

    if (!isPackableToolExport(tool)) {
      throw new Error(
        'index.ts 的 default export 必须是 defineTool()/defineToolSet() 返回的 factory-sdk 实例'
      );
    }

    await runtime.waitUntilReady();

    return {
      runtime,
      uploadDir: path.resolve(uploadDir),
      snapshot: createDebugSnapshot(tool, {
        entryDir: resolvedEntryDir,
        indexPath
      })
    };
  } finally {
    setCurrentLocalDebugRuntime(undefined);
    if (previousRuntimeMode === undefined) {
      delete process.env.RUNTIME_MODE;
    } else {
      process.env.RUNTIME_MODE = previousRuntimeMode;
    }
  }
}

export async function runDebugTool({
  runtime,
  snapshot,
  toolId,
  input,
  secrets,
  systemVar
}: {
  runtime: LocalDebugRuntime;
  snapshot: DebugPluginSnapshot;
  toolId?: string;
  input: Record<string, unknown>;
  secrets?: Record<string, unknown>;
  systemVar?: Partial<SystemVarType>;
}): Promise<DebugToolRunResult> {
  const targetTool = pickTargetTool(snapshot, toolId);
  const mergedSystemVar = createDebugSystemVar(snapshot, targetTool.id, systemVar);

  const response = await runtime.invokePlugin<
    {
      input: Record<string, unknown>;
      systemVar: SystemVarType;
      childId?: string;
      secrets?: Record<string, unknown>;
    },
    void,
    never,
    ToolStreamMessageType
  >(
    'run',
    {
      input,
      systemVar: mergedSystemVar,
      ...(snapshot.isToolSet ? { childId: targetTool.id } : {}),
      ...(secrets ? { secrets } : {})
    },
    {
      traceId: randomUUID()
    }
  );

  if (!response.output) {
    throw new Error('调试运行未返回输出流。');
  }

  const streamMessages: ToolStreamMessageType[] = [];
  let finalResponse: Record<string, unknown> | undefined;
  let finalError: string | undefined;

  await response.output.stream.consume(async (chunk) => {
    const parsed = ToolStreamMessageSchema.parse(chunk);
    streamMessages.push(parsed);

    if (parsed.type === 'response') {
      finalResponse = parsed.data;
    }
    if (parsed.type === 'error') {
      finalError = parsed.data;
    }
  });

  return {
    systemVar: mergedSystemVar,
    response: finalResponse,
    error: finalError,
    streamMessages
  };
}

export function createDebugSystemVar(
  snapshot: DebugPluginSnapshot,
  toolId: string,
  overrides?: Partial<SystemVarType>
): SystemVarType {
  const base: SystemVarType = {
    app: {
      id: 'debug-app',
      name: 'FastGPT Local Debug'
    },
    chat: {
      chatId: 'debug-chat',
      uid: 'debugger'
    },
    invokeToken: 'debug-invoke-token',
    time: new Date().toISOString()
  };

  return SystemVarSchema.parse({
    ...base,
    ...overrides,
    app: {
      ...base.app,
      ...(overrides?.app ?? {})
    },
    chat: {
      ...base.chat,
      ...(overrides?.chat ?? {})
    }
  });
}

function createDebugSnapshot(
  tool: PackableToolExport,
  location: {
    entryDir: string;
    indexPath: string;
  }
): DebugPluginSnapshot {
  const userManifest = tool.getUserToolManifest();
  const children = tool.getChildManifests();
  const secretSchema = z.toJSONSchema(tool.getSecretSchema());

  const tools =
    children.length === 0
      ? [createSingleToolSnapshot(tool, userManifest)]
      : children.map((child) => createChildToolSnapshot(tool, child));

  return {
    entryDir: location.entryDir,
    indexPath: location.indexPath,
    pluginId: getRequiredString(userManifest.pluginId, '缺少 pluginId'),
    version: getRequiredString(userManifest.version, '缺少 version'),
    name: pickLocalizedText(userManifest.name),
    description: pickLocalizedText(userManifest.description),
    toolDescription: pickToolDescription(
      getOptionalString(userManifest.toolDescription),
      userManifest.description
    ),
    author: getOptionalString(userManifest.author),
    tags: toStringArray(userManifest.tags),
    permissions: toStringArray(userManifest.permission),
    secretSchema: ensurePlainObject(secretSchema),
    isToolSet: children.length > 0,
    tools
  };
}

function createSingleToolSnapshot(
  tool: PackableToolExport,
  userManifest: Record<string, unknown>
): DebugToolSnapshot {
  const handler = tool.getToolHandler();
  if (!handler) {
    throw new Error('default export 未注册任何工具 handler');
  }

  return {
    id: 'tool',
    name: pickLocalizedText(userManifest.name),
    description: pickLocalizedText(userManifest.description),
    toolDescription: pickToolDescription(
      getOptionalString(userManifest.toolDescription),
      userManifest.description
    ),
    inputSchema: ensurePlainObject(z.toJSONSchema(handler.inputSchema)),
    outputSchema: ensurePlainObject(z.toJSONSchema(handler.outputSchema))
  };
}

function createChildToolSnapshot(
  tool: PackableToolExport,
  child: PackableToolChild
): DebugToolSnapshot {
  const handler = tool.getToolHandler(child.id);
  if (!handler) {
    throw new Error(`找不到子工具 handler: ${child.id}`);
  }

  return {
    id: child.id,
    name: pickLocalizedText(child.name),
    description: pickLocalizedText(child.description),
    toolDescription: pickToolDescription(child.toolDescription, child.description),
    inputSchema: ensurePlainObject(z.toJSONSchema(handler.inputSchema)),
    outputSchema: ensurePlainObject(z.toJSONSchema(handler.outputSchema))
  };
}

function pickTargetTool(snapshot: DebugPluginSnapshot, toolId?: string): DebugToolSnapshot {
  if (!snapshot.isToolSet) {
    return snapshot.tools[0];
  }

  if (!toolId) {
    throw new Error('当前插件是工具集，请通过 --tool <childId> 指定要调试的子工具。');
  }

  const tool = snapshot.tools.find((item) => item.id === toolId);
  if (!tool) {
    throw new Error(`找不到子工具: ${toolId}`);
  }

  return tool;
}

function createVirtualHostHandler(uploadDir: string) {
  return async ({ method, args, input }: LocalDebugHostRequestContext): Promise<unknown> => {
    const invokeArgs = ensurePlainObject(args);

    switch (method) {
      case InvokeMethodEnum.uploadFile: {
        const buffer = await readSourceToBuffer(input);
        const fileName = sanitizeFileName(
          typeof invokeArgs.fileName === 'string' && invokeArgs.fileName.trim().length > 0
            ? invokeArgs.fileName
            : 'debug-upload.bin'
        );
        const contentType =
          typeof invokeArgs.contentType === 'string' && invokeArgs.contentType.trim().length > 0
            ? invokeArgs.contentType
            : 'application/octet-stream';
        const saveDir = path.resolve(uploadDir);
        const outputPath = path.join(
          saveDir,
          `${Date.now()}-${randomUUID().slice(0, 8)}-${fileName}`
        );

        await fs.mkdir(saveDir, { recursive: true });
        await fs.writeFile(outputPath, buffer);

        return successResult({
          fileName,
          contentType,
          size: buffer.length,
          etag: createHash('md5').update(buffer).digest('hex'),
          createTime: new Date(),
          accessURL: pathToFileURL(outputPath).href
        });
      }
      default:
        throw new Error(`本地虚拟环境暂不支持反向调用: ${String(method)}`);
    }
  };
}

async function readSourceToBuffer(
  source?: StreamData<unknown> | AsyncIterable<unknown>
): Promise<Buffer> {
  if (!source) {
    return Buffer.alloc(0);
  }

  const chunks: Buffer[] = [];
  const iterable = isStreamDataLike(source) ? source.values() : source;

  for await (const chunk of iterable) {
    chunks.push(toBuffer(chunk));
  }
  return Buffer.concat(chunks);
}

function isStreamDataLike<T>(
  source: StreamData<T> | AsyncIterable<T>
): source is StreamData<T> {
  return (
    source instanceof StreamData ||
    (typeof source === 'object' &&
      source !== null &&
      typeof (source as { values?: unknown }).values === 'function' &&
      typeof (source as { consume?: unknown }).consume === 'function')
  );
}

function toBuffer(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) {
    return value;
  }
  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }
  if (typeof value === 'string') {
    return Buffer.from(value);
  }
  return Buffer.from(JSON.stringify(value));
}

function isPackableToolExport(value: unknown): value is PackableToolExport {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'getUserToolManifest' in value &&
      typeof value.getUserToolManifest === 'function' &&
      'getSecretSchema' in value &&
      typeof value.getSecretSchema === 'function' &&
      'getToolHandler' in value &&
      typeof value.getToolHandler === 'function' &&
      'getChildManifests' in value &&
      typeof value.getChildManifests === 'function'
  );
}

function pickLocalizedText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object') {
    const localized = value as Record<string, unknown>;
    const preferred = [localized['zh-CN'], localized.en, ...Object.values(localized)].find(
      (item) => typeof item === 'string' && item.trim().length > 0
    );

    if (typeof preferred === 'string') {
      return preferred;
    }
  }

  return '';
}

function pickToolDescription(
  explicitDescription: string | undefined,
  fallbackSource: unknown
): string {
  if (explicitDescription && explicitDescription.trim().length > 0) {
    return explicitDescription;
  }

  return pickLocalizedText(fallbackSource);
}

function getRequiredString(value: unknown, message: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  throw new Error(message);
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.filter((item): item is string => typeof item === 'string');
  return items.length > 0 ? items : undefined;
}

function ensurePlainObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function sanitizeFileName(fileName: string): string {
  return Array.from(fileName, (char) => {
    const code = char.charCodeAt(0);

    if (INVALID_FILE_NAME_CHARS.has(char) || code <= 0x1f) {
      return '_';
    }

    return char;
  }).join('');
}

const INVALID_FILE_NAME_CHARS = new Set(['<', '>', ':', '"', '/', '\\', '|', '?', '*']);

async function assertPathExists(targetPath: string, message: string): Promise<void> {
  try {
    await fs.access(targetPath);
  } catch {
    throw new Error(message);
  }
}
