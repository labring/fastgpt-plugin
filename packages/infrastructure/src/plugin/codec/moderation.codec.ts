import { ModerationSchema, type ModerationType } from '@domain/entities/moderation.entity';
import { failureResult, successResult } from '@domain/value-objects/result.vo';

import { PluginRecordPayloadSchema, type PluginRecordType } from './plugin.record';
import type { PluginCodec } from './registry';

export const moderationPluginCodec: PluginCodec<ModerationType> = {
  type: 'moderation',
  toRecord(plugin) {
    const { secretSchema, meta, ...base } = ModerationSchema.parse(plugin);

    return PluginRecordPayloadSchema.parse({
      ...base,
      data: {
        secretSchema,
        meta
      }
    });
  },
  fromRecord(record: PluginRecordType) {
    return ModerationSchema.parse({
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

    return successResult({
      ...plugin,
      icon: icon ?? plugin.icon,
      ...(readmeUrl !== undefined ? { readmeUrl } : {})
    });
  }
};
