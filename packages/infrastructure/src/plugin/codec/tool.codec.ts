import { ToolSchema, type ToolType } from '@domain/entities/tool.entity';
import { I18nLangSchema } from '@domain/value-objects/i18n-string.vo';
import { failureResult, successResult } from '@domain/value-objects/result.vo';

import { PluginRecordPayloadSchema, type PluginRecordType } from './plugin.record';
import type { PluginCodec } from './registry';

export const toolPluginCodec: PluginCodec<ToolType> = {
  type: 'tool',
  toRecord(plugin) {
    const parsedPlugin = ToolSchema.parse(plugin);
    const { inputSchema, outputSchema, secretSchema, children, toolDescription, ...base } =
      parsedPlugin;

    return PluginRecordPayloadSchema.parse({
      ...base,
      data: {
        inputSchema,
        outputSchema,
        secretSchema,
        ...(toolDescription !== undefined ? { toolDescription } : {}),
        ...(children !== undefined ? { children } : {})
      }
    });
  },
  fromRecord(record: PluginRecordType) {
    return ToolSchema.parse({
      ...record,
      ...record.data,
      children:
        record.data && 'children' in record.data
          ? ((record.data.children ?? undefined) as ToolType['children'])
          : undefined
    });
  },
  async refreshConfirmedAssets(plugin, { resolvePublicFileURL }) {
    const [icon, iconErr] = await resolvePublicFileURL(plugin.icon);
    if (iconErr) {
      return failureResult(iconErr);
    }

    const [readmeUrl, readmeErr] = await resolvePublicFileURL(plugin.readmeUrl);
    if (readmeErr) {
      return failureResult(readmeErr);
    }

    const readmeUrls: NonNullable<ToolType['readmeUrls']> = {};
    for (const locale of I18nLangSchema.options) {
      const existingUrl = plugin.readmeUrls?.[locale];
      if (!existingUrl) continue;

      const [url, readmeLocaleErr] = await resolvePublicFileURL(existingUrl);
      if (readmeLocaleErr) {
        return failureResult(readmeLocaleErr);
      }
      if (url) {
        readmeUrls[locale] = url;
      }
    }

    let children: ToolType['children'];
    if (plugin.children) {
      children = [];
      for (const child of plugin.children) {
        const [childIcon, childIconErr] = await resolvePublicFileURL(child.icon);
        if (childIconErr) {
          return failureResult(childIconErr);
        }
        children.push({
          ...child,
          icon: childIcon ?? child.icon
        });
      }
    }

    return successResult({
      ...plugin,
      icon: icon ?? plugin.icon,
      ...(readmeUrl !== undefined ? { readmeUrl } : {}),
      ...(Object.keys(readmeUrls).length > 0 ? { readmeUrls } : {}),
      children
    });
  }
};
