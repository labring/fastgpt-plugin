import { ToolSchema, type ToolType } from '@domain/entities/tool.entity';
import { failureResult, successResult } from '@domain/value-objects/result.vo';

import { PluginRecordPayloadSchema, type PluginRecordType } from './plugin.record';
import type { PluginCodec } from './registry';

export const toolPluginCodec: PluginCodec<ToolType> = {
  type: 'tool',
  toRecord(plugin) {
    const parsedPlugin = ToolSchema.parse(plugin);
    const { toolDescription, inputSchema, outputSchema, secretSchema, children, ...base } =
      parsedPlugin;

    return PluginRecordPayloadSchema.parse({
      ...base,
      data: {
        toolDescription,
        inputSchema,
        outputSchema,
        secretSchema,
        children
      }
    });
  },
  fromRecord(record: PluginRecordType) {
    return ToolSchema.parse({
      ...record,
      ...record.data
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
      children
    });
  }
};
