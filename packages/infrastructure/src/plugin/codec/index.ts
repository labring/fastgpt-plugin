import { PluginCodecRegistry } from './registry';
import { toolPluginCodec } from './tool.codec';

export * from './plugin.record';
export * from './registry';

export const pluginCodecRegistry = new PluginCodecRegistry();

pluginCodecRegistry.register(toolPluginCodec);
