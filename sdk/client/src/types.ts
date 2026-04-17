import type {
  AiproxyMapProviderItemDTOType,
  ModelListDTOType,
  ModelProviderItemDTOType,
  ModelProviderListDTOType
} from '@interface-adapter/contracts/dto/model.dto';
import type {
  PluginDetailDTOType,
  PluginDTOType,
  PluginGetParamsDTOType,
  PluginInstallFailureDTOType,
  PluginInstallResponseDTOType,
  PluginListDTOType,
  PluginListParamsDTOType,
  PluginPruneDisabledResponseDTOType,
  PluginRuntimeConfigDTOType
} from '@interface-adapter/contracts/dto/plugin.dto';
import type { ToolRunInputDTOType } from '@interface-adapter/contracts/dto/tool.dto';
import type { WorkflowListDTOType, WorkflowTemplateDTOType } from '@interface-adapter/contracts/dto/workflow.dto';

import type {
  EmbeddingModelItemType,
  LLMModelItemType,
  ModelItemType,
  RerankModelItemType,
  STTModelItemType,
  TTSModelItemType
} from '@domain/entities/model.entity';
import type { PluginTagType, PluginTypeType } from '@domain/entities/plugin.entity';
import type { I18nStringStrictType, I18nStringType } from '@domain/value-objects/i18n-string.vo';
import type { PluginTagListType, PluginUniqueIdType } from '@domain/value-objects/plugin.vo';
import type { SystemVarType } from '@domain/value-objects/system-var.vo';
import type { ToolAnswerType, ToolHandlerReturnType, ToolStreamMessageType } from '@domain/value-objects/tool.vo';

export type JsonObject = Record<string, unknown>;

export type {
  EmbeddingModelItemType,
  I18nStringStrictType,
  I18nStringType,
  LLMModelItemType,
  ModelItemType,
  PluginTagListType,
  PluginTagType,
  PluginTypeType,
  PluginUniqueIdType,
  RerankModelItemType,
  STTModelItemType,
  SystemVarType,
  ToolAnswerType,
  ToolHandlerReturnType,
  ToolStreamMessageType,
  TTSModelItemType
};

export type ToolRunInputType = ToolRunInputDTOType;

export type PluginSummaryType = PluginDTOType;
export type PluginDetailType = PluginDetailDTOType;
export type PluginGetParamsType = PluginGetParamsDTOType;
export type PluginListType = PluginListDTOType;
export type PluginListParamsType = PluginListParamsDTOType;
export type PluginInstallFailureType = PluginInstallFailureDTOType;
export type PluginInstallResultType = PluginInstallResponseDTOType;
export type PluginTagListItemType = PluginTagListType[number];
export type PluginPruneDisabledResultType = PluginPruneDisabledResponseDTOType;
export type PluginRuntimeConfigType = PluginRuntimeConfigDTOType;

export type ModelListType = ModelListDTOType;
export type WorkflowTemplateType = WorkflowTemplateDTOType;
export type WorkflowListType = WorkflowListDTOType;

export type ModelProviderItemType = ModelProviderItemDTOType;
export type AiproxyMapProviderItemType = AiproxyMapProviderItemDTOType;
export type ModelProviderListType = ModelProviderListDTOType;

export type RunToolStreamParams = ToolRunInputType & {
  onMessage?: (message: ToolAnswerType) => void;
};

export type FastGPTPluginClientOptions = {
  baseUrl: string;
  token?: string;
  fetch?: typeof globalThis.fetch;
};

export type ClientRequestOptions = {
  signal?: AbortSignal;
};
