import type {
  AIProxyChannelItemDTOType,
  ModelListDTOType,
  ModelProviderItemDTOType,
  ModelProviderListDTOType
} from '@interface-adapter/contracts/dto/model.dto';
import type {
  PluginDTOType,
  PluginInstallFailureDTOType,
  PluginInstallResponseDTOType,
  PluginListDTOType,
  PluginListItemDTOType,
  PluginListParamsDTOType,
  PluginPruneDisabledResponseDTOType,
  PluginRuntimeConfigDTOType,
  PluginUploadFailureDTOType,
  PluginUploadResponseDTOType,
  PluginVersionItemDTOType,
  PluginVersionListDTOType,
  PluginVersionListParamsDTOType
} from '@interface-adapter/contracts/dto/plugin.dto';
import type {
  PluginDebugSessionConnectionKeyExchangeRequestDTO,
  PluginDebugSessionConnectionKeyExchangeResponseDTO,
  PluginDebugSessionCreateRequestDTO,
  PluginDebugSessionCreateResponseDTO,
  PluginDebugSessionGetParamsDTO,
  PluginDebugSessionRevokeRequestDTO,
  PluginDebugSessionRevokeResponseDTO,
  PluginDebugSessionStatusDTO,
  PluginDebugSessionStatusResponseDTO
} from '@interface-adapter/contracts/dto/plugin-debug-session.dto';
import type { PluginServiceFeaturesDTO } from '@interface-adapter/contracts/dto/plugin-service-feature.dto';
import type {
  ToolDetailDTOType,
  ToolGetParamsDTOType,
  ToolListDTOType,
  ToolListItemDTOType,
  ToolListParamsDTOType,
  ToolRunInputDTOType
} from '@interface-adapter/contracts/dto/tool.dto';
import type {
  WorkflowListDTOType,
  WorkflowTemplateDTOType
} from '@interface-adapter/contracts/dto/workflow.dto';

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
import type {
  PluginSourceType,
  PluginTagListType,
  PluginUniqueIdType
} from '@domain/value-objects/plugin.vo';
import type { SystemVarType } from '@domain/value-objects/system-var.vo';
import type {
  ToolAnswerType,
  ToolHandlerReturnType,
  ToolStreamMessageType
} from '@domain/value-objects/tool.vo';
import { PluginTagsNameMap } from '@infrastructure/static-data/plugin-tag';

export type JsonObject = Record<string, unknown>;

export type {
  EmbeddingModelItemType,
  I18nStringStrictType,
  I18nStringType,
  LLMModelItemType,
  ModelItemType,
  PluginSourceType,
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
export type ToolDetailType = ToolDetailDTOType;
export type ToolGetParamsType = ToolGetParamsDTOType;
export type ToolListType = ToolListDTOType;
export type ToolListItemType = ToolListItemDTOType;
export type ToolListParamsType = Partial<ToolListParamsDTOType>;

export type PluginSummaryType = PluginDTOType;
export type PluginUploadResultType = PluginUploadResponseDTOType;
export type PluginListType = PluginListDTOType;
export type PluginListItemType = PluginListItemDTOType;
export type PluginListParamsType = Partial<PluginListParamsDTOType>;
export type PluginInstallFailureType = PluginInstallFailureDTOType;
export type PluginInstallResultType = PluginInstallResponseDTOType;
export type PluginUploadFailureType = PluginUploadFailureDTOType;
export type PluginTagListItemType = PluginTagListType[number];
export type PluginPruneDisabledResultType = PluginPruneDisabledResponseDTOType;
export type PluginRuntimeConfigType = PluginRuntimeConfigDTOType;
export type PluginVersionItemType = PluginVersionItemDTOType;
export type PluginVersionListType = PluginVersionListDTOType;
export type PluginVersionListParamsType = PluginVersionListParamsDTOType;
export type PluginDebugSessionStatusType = PluginDebugSessionStatusDTO;
export type PluginDebugSessionCreateParamsType = PluginDebugSessionCreateRequestDTO;
export type PluginDebugSessionCreateResultType = PluginDebugSessionCreateResponseDTO;
export type PluginDebugSessionConnectionKeyExchangeParamsType =
  PluginDebugSessionConnectionKeyExchangeRequestDTO;
export type PluginDebugSessionConnectionKeyExchangeResultType =
  PluginDebugSessionConnectionKeyExchangeResponseDTO;
export type PluginDebugSessionStatusParamsType = PluginDebugSessionGetParamsDTO;
export type PluginDebugSessionStatusResultType = PluginDebugSessionStatusResponseDTO;
export type PluginDebugSessionRevokeParamsType = PluginDebugSessionRevokeRequestDTO;
export type PluginDebugSessionRevokeResultType = PluginDebugSessionRevokeResponseDTO;
export type PluginServiceFeaturesType = PluginServiceFeaturesDTO;

export const pluginTagList: PluginTagListType = Object.entries(PluginTagsNameMap).map(
  ([id, name]) => ({
    id,
    name
  })
);

export type ModelListType = ModelListDTOType;
export type WorkflowTemplateType = WorkflowTemplateDTOType;
export type WorkflowListType = WorkflowListDTOType;

export type ModelProviderItemType = ModelProviderItemDTOType;
export type AIProxyChannelItemType = AIProxyChannelItemDTOType;
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

export {
  PluginPermissionEnum,
  PluginPermissionEnumSchema,
  type PluginPermissionEnumType
} from '@domain/value-objects/permission.vo';
