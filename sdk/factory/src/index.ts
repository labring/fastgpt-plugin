import z from 'zod';

import type { UserToolManifestType } from './manifest.type';
import {
  createToolHandler,
  type ToolChildManifestDefinition,
  ToolFactory,
  type ToolHandlerDefinition
} from './tool-factory';

export { createToolHandler };

export type InputSchemaMetaType = z.GlobalMeta;

export type OutputSchemaMetaType = z.GlobalMeta;

export type SecretSchemaMetaType = z.GlobalMeta & {
  /** 标注该字段是否需要加密存储 */
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
      ...(child.toolDescription !== undefined ? { toolDescription: child.toolDescription } : {})
    });
  });
  toolSet.setSecretSchema(secretSchema ?? z.object());
  return toolSet;
};

export type { ToolHandlerContext } from './tool-factory';
