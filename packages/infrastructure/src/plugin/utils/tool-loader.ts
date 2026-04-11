import json5 from 'json5';

import type { PluginType } from '@domain/entities/plugin.entity';
import { ToolSchema, type ToolType } from '@domain/entities/tool.entity';
import type { PluginSourceType } from '@domain/value-objects/plugin.vo';
import {
  PluginManifestBaseSchema,
  ToolManifestSchema
} from '@domain/value-objects/plugin/plugin-manifest.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';

const parse = json5.parse;

type LoadPluginParams = {
  manifest: string;
  etag: string;
  getAccessURL: (arg: {
    pluginId: string;
    version: string;
    filePath: string[];
  }) => Promise<Result<string>>;
  source: PluginSourceType;
};

const loadTool = ({
  manifest,
  etag,
  getAccessURL: getPath,
  source
}: LoadPluginParams): Result<ToolType> => {
  try {
    const manifestObj = ToolManifestSchema.parse(manifest);
    const isToolSet = manifestObj.children;

    const children = manifestObj.children?.map((childManifest) => {
      return {
        ...childManifest,
        icon:
          childManifest.icon ??
          getPath({
            pluginId: manifestObj.pluginId,
            version: manifestObj.version,
            filePath: [childManifest.icon]
          })
      };
    }) satisfies ToolType['meta']['children'];

    const result = {
      ...manifestObj,
      etag,
      source,
      meta: {
        toolDescription: manifestObj.toolDescription,
        children: isToolSet ? children : undefined,
        inputSchema: manifestObj.inputSchema,
        outputSchema: manifestObj.outputSchema,
        secretSchema: manifestObj.secretSchema
      }
    } satisfies ToolType;

    return successResult(ToolSchema.parse(result));
  } catch (err) {
    return failureResult(
      {
        en: 'parse tool failed',
        'zh-CN': '解析工具失败'
      },
      err
    );
  }
};

export const loadPlugin = async (params: LoadPluginParams): Promise<Result<PluginType>> => {
  try {
    // 1. get the type first
    // 2. for each different type, use different schema to parse
    const manifest = parse(params.manifest);
    const { success, data } = PluginManifestBaseSchema.pick({ type: true }).safeParse(manifest);

    if (!success) {
      return failureResult({
        en: 'parse manifest.json failed: can not find type field',
        'zh-CN': '解析 manifest.json 失败: 找不到 type 字段'
      });
    }

    switch (data.type) {
      case 'tool':
        return loadTool({
          ...params,
          manifest
        });
      // case 'model':
      // case 'workflow':
      // case 'dataset':
      default:
        return failureResult({
          en: `unsupported plugin type: ${data.type}`,
          'zh-CN': `不支持的插件类型: ${data.type}`
        });
    }
  } catch {
    return failureResult({
      en: 'parse manifest.json failed',
      'zh-CN': '解析 manifest.json 失败'
    });
  }
};
