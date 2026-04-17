import type { PluginType, PluginTypeType } from '@domain/entities/plugin.entity';
import type { Result } from '@domain/value-objects/result.vo';

import type { PluginRecordPayloadType, PluginRecordType } from './plugin.record';

export type PluginCodecResolvePublicFileURL = (
  value: string | undefined
) => Promise<Result<string | undefined>>;

export interface PluginCodec<TPlugin extends PluginType = PluginType> {
  type: TPlugin['type'];
  toRecord(plugin: TPlugin): PluginRecordPayloadType;
  fromRecord(record: PluginRecordType): TPlugin;
  refreshConfirmedAssets(
    plugin: TPlugin,
    helpers: {
      resolvePublicFileURL: PluginCodecResolvePublicFileURL;
    }
  ): Promise<Result<TPlugin>>;
}

export class PluginCodecRegistry {
  private codecs = new Map<PluginTypeType, PluginCodec>();

  register<TPlugin extends PluginType>(codec: PluginCodec<TPlugin>) {
    this.codecs.set(codec.type, codec);
  }

  private get(type: PluginTypeType): PluginCodec {
    const codec = this.codecs.get(type);
    if (!codec) {
      throw new Error(`Plugin codec not found: ${type}`);
    }
    return codec;
  }

  toRecord(plugin: PluginType): PluginRecordPayloadType {
    return this.get(plugin.type).toRecord(plugin);
  }

  fromRecord(record: PluginRecordType): PluginType {
    return this.get(record.type).fromRecord(record);
  }

  refreshConfirmedAssets(
    plugin: PluginType,
    helpers: {
      resolvePublicFileURL: PluginCodecResolvePublicFileURL;
    }
  ): Promise<Result<PluginType>> {
    return this.get(plugin.type).refreshConfirmedAssets(plugin, helpers);
  }
}
