import type { PluginRuntimeChannelPort } from '@infrastructure/plugin/plugin-runtime/ports/channel';

export type PluginRuntimeChannel = PluginRuntimeChannelPort<'client'>;

export interface LocalDebugRuntimeLike {
  pluginChannel: PluginRuntimeChannel;
}

export const LOCAL_DEBUG_RUNTIME_GLOBAL_KEY = '__FASTGPT_PLUGIN_LOCAL_DEBUG_RUNTIME__';
