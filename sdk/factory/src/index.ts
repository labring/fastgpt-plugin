import z from 'zod';

import type { I18nStringType } from '@domain/value-objects/i18n-string.vo';

import type { UserToolManifestType } from './manifest.type';
import {
  createToolHandler,
  type ToolChildManifestDefinition,
  ToolFactory,
  type ToolHandlerDefinition
} from './tool-factory';

export { createToolHandler };

export type { InputFieldDefinition, OutputFieldDefinition } from './schema-helpers';
export { defineInputSchema, defineOutputSchema } from './schema-helpers';

export type I18nSchemaMetaType = {
  title: I18nStringType;
  description?: I18nStringType;
  placeholder?: I18nStringType;
};

export {
  ToolHandlerReturnSchema,
  type ToolHandlerReturnType,
  ToolMessageContentPartSchema,
  type ToolMessageContentPartType
} from '@domain/value-objects/tool.vo';

export type InputSchemaMetaType = z.GlobalMeta & {
  /** Localized strings for the UI. */
  'x-i18n'?: I18nSchemaMetaType;
  /** Whether AI should be encouraged to fill this field. */
  isToolParam?: boolean;
};

export type OutputSchemaMetaType = z.GlobalMeta & {
  /** Localized strings for the UI. */
  'x-i18n'?: I18nSchemaMetaType;
};

export type SecretSchemaMetaType = z.GlobalMeta & {
  /** Localized strings for the UI. */
  'x-i18n'?: I18nSchemaMetaType;
  /** Whether this field should be stored encrypted. */
  isSecret: boolean;
};

export interface DefinedToolFactory {
  setSecretSchema<TSecret extends Record<string, unknown>>(schema: z.ZodType<TSecret>): void;
  registerTool(
    definition: ToolHandlerDefinition,
    id?: string,
    childManifest?: ToolChildManifestDefinition
  ): void;
  getSecretSchema(): z.ZodType<any>;
  getToolHandler(): ToolHandlerDefinition;
  getToolHandler(childId: string): ToolHandlerDefinition | undefined;
  getUserToolManifest(): UserToolManifestType;
  getChildManifests(): ToolChildManifestDefinition[];
}

export const defineTool = ({
  manifest,
  handler
}: {
  manifest: UserToolManifestType;
  handler: ToolHandlerDefinition<any, any, any>;
}): DefinedToolFactory => {
  const tool = ToolFactory.getInstance(manifest);
  tool.setSecretSchema(handler.secretSchema ?? z.object());
  tool.registerTool(handler);
  return tool;
};

export const defineToolSet = ({
  manifest,
  children,
  secretSchema
}: {
  manifest: UserToolManifestType;
  secretSchema?: z.ZodObject<any>;
  children: (ToolChildManifestDefinition & {
    handler: ToolHandlerDefinition<any, any, any>;
  })[];
}): DefinedToolFactory => {
  const toolSet = ToolFactory.getInstance(manifest);
  children.forEach((child) => {
    toolSet.registerTool(child.handler, child.id, {
      id: child.id,
      description: child.description,
      name: child.name,
      ...(child.icon !== undefined ? { icon: child.icon } : {}),
    });
  });
  toolSet.setSecretSchema(secretSchema ?? z.object());
  return toolSet;
};

export type { ToolHandlerContext } from './tool-factory';
