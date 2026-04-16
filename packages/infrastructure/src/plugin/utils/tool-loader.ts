import json5 from 'json5';

import type { PluginType } from '@domain/entities/plugin.entity';
import { ToolSchema, type ToolType } from '@domain/entities/tool.entity';
import type { PluginSourceType } from '@domain/value-objects/plugin.vo';
import {
  PluginManifestBaseSchema,
  ToolManifestSchema,
  type ToolManifestType
} from '@domain/value-objects/plugin/plugin-manifest.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';

const parse = json5.parse;

type LoadPluginParams = {
  manifest: string;
  etag: string;
  availableFiles: string[];
  getAccessURL: (arg: {
    pluginId: string;
    version: string;
    filePath: string[];
  }) => Promise<Result<string>>;
  source: PluginSourceType;
};

const resolveAssetURL = async ({
  getAccessURL,
  pluginId,
  version,
  filePath
}: {
  getAccessURL: LoadPluginParams['getAccessURL'];
  pluginId: string;
  version: string;
  filePath: string[];
}): Promise<Result<string>> => {
  return getAccessURL({
    pluginId,
    version,
    filePath
  });
};

const loadTool = async ({
  manifest,
  etag,
  availableFiles,
  getAccessURL,
  source
}: Omit<LoadPluginParams, 'manifest'> & {
  manifest: ToolManifestType;
}): Promise<Result<ToolType>> => {
  try {
    const availableFileSet = new Set(availableFiles);
    let icon = manifest.icon;
    if (availableFileSet.has(manifest.icon)) {
      const [resolvedIcon, iconErr] = await resolveAssetURL({
        getAccessURL,
        pluginId: manifest.pluginId,
        version: manifest.version,
        filePath: [manifest.icon]
      });

      if (iconErr) {
        return failureResult(
          {
            en: 'resolve plugin icon failed',
            'zh-CN': '解析插件图标失败'
          },
          iconErr
        );
      }
      icon = resolvedIcon;
    }

    const readmeUrl = availableFileSet.has('README.md')
      ? (await resolveAssetURL({
          getAccessURL,
          pluginId: manifest.pluginId,
          version: manifest.version,
          filePath: ['README.md']
        }))[0]
      : undefined;

    let children: ToolType['children'];
    if (manifest.children) {
      children = [];
      for (const childManifest of manifest.children) {
        let childIcon = childManifest.icon;
        if (availableFileSet.has(childManifest.icon)) {
          const [resolvedChildIcon, childIconErr] = await resolveAssetURL({
            getAccessURL,
            pluginId: manifest.pluginId,
            version: manifest.version,
            filePath: [childManifest.icon]
          });

          if (childIconErr) {
            return failureResult(
              {
                en: `resolve child icon failed: ${childManifest.id}`,
                'zh-CN': `解析子工具图标失败: ${childManifest.id}`
              },
              childIconErr
            );
          }
          childIcon = resolvedChildIcon;
        }

        children.push({
          ...childManifest,
          icon: childIcon
        });
      }
    }

    const result = {
      ...manifest,
      etag,
      source,
      icon,
      ...(readmeUrl ? { readmeUrl } : {}),
      children,
      toolDescription: manifest.toolDescription,
      inputSchema: manifest.inputSchema,
      outputSchema: manifest.outputSchema,
      secretSchema: manifest.secretSchema
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
        return await loadTool({
          ...params,
          manifest: ToolManifestSchema.parse(manifest)
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
