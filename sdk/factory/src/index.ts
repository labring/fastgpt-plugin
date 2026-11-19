import { bindNodeTool } from './node-tool-runtime';
import { defineTool as definePortableTool, defineToolSet as definePortableToolSet } from './tool-definition';

export * from './tool-definition';

export const defineTool: typeof definePortableTool = (options) => bindNodeTool(definePortableTool(options));
export const defineToolSet: typeof definePortableToolSet = (options) => bindNodeTool(definePortableToolSet(options));

export {
  defineModerationManifest,
  type UserModerationManifestType,
  type UserModerationMetaType
} from './manifest.type';
export {
  defineModeration,
  ModerationFactory,
  type ModerationProvider,
  type ModerationProviderContext,
  type ModerationProviderResultType
} from './moderation-factory';
export { configurePluginProxy, hasProxyEnv } from './proxy';
export type {
  ModerationCheckInputType,
  ModerationHitType,
  ModerationLabelType,
  ModerationResultType,
  ModerationVerdictType
} from '@domain/value-objects/moderation.vo';
