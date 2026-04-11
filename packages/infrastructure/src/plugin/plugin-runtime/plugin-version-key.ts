// import type { PluginUniqueIdType } from '@domain/value-objects/plugin.vo';

// import { VersionKeyStore, type VersionKeyStoreDeps } from '../redis/version-key';

// export class PluginRuntimeVersionKeyStore extends VersionKeyStore {
//   constructor(deps: VersionKeyStoreDeps) {
//     super(deps);
//   }

//   private getKey({ etag, pluginId, version }: PluginUniqueIdType): string {
//     return `plugin-runtime:${pluginId}@${version}@${etag}`;
//   }

//   private resolveKey(keyOrUniqueId: string | PluginUniqueIdType): string {
//     return typeof keyOrUniqueId === 'string' ? keyOrUniqueId : this.getKey(keyOrUniqueId);
//   }

//   public override isVersionKeyExpired(key: string): Promise<boolean>;
//   public isVersionKeyExpired(uniqueId: PluginUniqueIdType): Promise<boolean>;

//   public override isVersionKeyExpired(
//     keyOrUniqueId: string | PluginUniqueIdType
//   ): Promise<boolean> {
//     return super.isVersionKeyExpired(this.resolveKey(keyOrUniqueId));
//   }

//   public override refreshVersionKey(key: string): Promise<string>;
//   public refreshVersionKey(uniqueId: PluginUniqueIdType): Promise<string>;
//   public override refreshVersionKey(keyOrUniqueId: string | PluginUniqueIdType): Promise<string> {
//     return super.refreshVersionKey(this.resolveKey(keyOrUniqueId));
//   }
// }
