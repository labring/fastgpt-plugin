import {
  PluginConfirmParamsSchema,
  PluginInstallDTOSchema,
  PluginListParamsSchema,
  PluginRuntimeConfigGetParamsSchema,
  PluginRuntimeConfigResetParamsSchema,
  PluginRuntimeConfigSetParamsSchema,
  PluginVersionListParamsSchema
} from '@interface-adapter/contracts/dto/plugin.dto';
import {
  PluginDebugSessionConnectionKeyExchangeRequestDTOSchema,
  PluginDebugSessionCreateRequestDTOSchema,
  PluginDebugSessionGetParamsDTOSchema,
  PluginDebugSessionRevokeRequestDTOSchema
} from '@interface-adapter/contracts/dto/plugin-debug-session.dto';
import {
  ToolGetParamsDTOSchema,
  ToolListParamsDTOSchema,
  ToolRunInputDTOSchema
} from '@interface-adapter/contracts/dto/tool.dto';
import { ModelContract } from '@interface-adapter/contracts/route/model.contract';
import { PluginContract } from '@interface-adapter/contracts/route/plugin.contract';
import { PluginDebugSessionContract } from '@interface-adapter/contracts/route/plugin-debug-session.contract';
import { ToolContract } from '@interface-adapter/contracts/route/tool.contract';
import { WorkflowContract } from '@interface-adapter/contracts/route/workflow.contract';

import { RunToolWithStream } from './tool-stream';
import { ClientTransport } from './transport';
import type {
  ClientRequestOptions,
  FastGPTPluginClientOptions,
  ModelListType,
  ModelProviderListType,
  PluginDebugSessionConnectionKeyExchangeParamsType,
  PluginDebugSessionConnectionKeyExchangeResultType,
  PluginDebugSessionCreateParamsType,
  PluginDebugSessionCreateResultType,
  PluginDebugSessionRevokeParamsType,
  PluginDebugSessionRevokeResultType,
  PluginDebugSessionStatusParamsType,
  PluginDebugSessionStatusResultType,
  PluginInstallResultType,
  PluginListParamsType,
  PluginListType,
  PluginPruneDisabledResultType,
  PluginRuntimeConfigType,
  PluginTagListType,
  PluginUniqueIdType,
  PluginUploadResultType,
  PluginVersionListParamsType,
  PluginVersionListType,
  RunToolStreamParams,
  ToolDetailType,
  ToolGetParamsType,
  ToolHandlerReturnType,
  ToolListParamsType,
  ToolListType,
  WorkflowListType
} from './types';
import { pluginTagList } from './types';

export class FastGPTPluginClient {
  private readonly transport: ClientTransport;
  private readonly toolRunner: RunToolWithStream;

  constructor(options: FastGPTPluginClientOptions) {
    this.transport = new ClientTransport(options);
    this.toolRunner = new RunToolWithStream(options);
  }

  async listModels(requestOptions?: ClientRequestOptions): Promise<ModelListType> {
    return this.transport.requestData<ModelListType>({
      path: this.withApiPath(ModelContract.List.meta.path),
      method: ModelContract.List.meta.method,
      signal: requestOptions?.signal
    });
  }

  async getModelProviders(requestOptions?: ClientRequestOptions): Promise<ModelProviderListType> {
    return this.transport.requestData<ModelProviderListType>({
      path: this.withApiPath(ModelContract.GetProviders.meta.path),
      method: ModelContract.GetProviders.meta.method,
      signal: requestOptions?.signal
    });
  }

  async listWorkflows(requestOptions?: ClientRequestOptions): Promise<WorkflowListType> {
    return this.transport.requestData<WorkflowListType>({
      path: this.withApiPath(WorkflowContract.List.meta.path),
      method: WorkflowContract.List.meta.method,
      signal: requestOptions?.signal
    });
  }

  async getTool(
    params: ToolGetParamsType,
    requestOptions?: ClientRequestOptions
  ): Promise<ToolDetailType> {
    const query = ToolGetParamsDTOSchema.parse(params);

    return this.transport.requestData<ToolDetailType>({
      path: this.withApiPath(ToolContract.Get.meta.path),
      method: ToolContract.Get.meta.method,
      query,
      signal: requestOptions?.signal
    });
  }

  async listTools(
    params: ToolListParamsType = {},
    requestOptions?: ClientRequestOptions
  ): Promise<ToolListType> {
    const query = ToolListParamsDTOSchema.parse(params);

    return this.transport.requestData<ToolListType>({
      path: this.withApiPath(ToolContract.List.meta.path),
      method: ToolContract.List.meta.method,
      query,
      signal: requestOptions?.signal
    });
  }

  async uploadPlugin(
    files: (Blob | { file: Blob; filename?: string })[],
    requestOptions?: ClientRequestOptions
  ): Promise<PluginUploadResultType> {
    const formData = new FormData();

    files.forEach((item, index) => {
      const file = item instanceof Blob ? item : item.file;
      const filename = item instanceof Blob ? undefined : item.filename;
      const defaultName =
        typeof File !== 'undefined' && file instanceof File ? file.name : `plugin-${index}.pkg`;

      formData.append('files', file, filename ?? defaultName);
    });

    return this.transport.requestData<PluginUploadResultType>({
      path: this.withApiPath(PluginContract.Upload.meta.path),
      method: PluginContract.Upload.meta.method,
      body: formData,
      signal: requestOptions?.signal
    });
  }

  async confirmPlugin(
    uniqueIds: PluginUniqueIdType[],
    requestOptions?: ClientRequestOptions
  ): Promise<void> {
    const payload = PluginConfirmParamsSchema.parse({ uniqueIds });

    await this.transport.requestEmpty({
      path: this.withApiPath(PluginContract.Confirm.meta.path),
      method: PluginContract.Confirm.meta.method,
      body: payload,
      signal: requestOptions?.signal
    });
  }

  async pruneDisabledPlugins(
    requestOptions?: ClientRequestOptions
  ): Promise<PluginPruneDisabledResultType> {
    return this.transport.requestData<PluginPruneDisabledResultType>({
      path: this.withApiPath(PluginContract.PruneDisabled.meta.path),
      method: PluginContract.PruneDisabled.meta.method,
      signal: requestOptions?.signal
    });
  }

  async installPlugins(
    urls: string[],
    requestOptions?: ClientRequestOptions
  ): Promise<PluginInstallResultType> {
    const payload = PluginInstallDTOSchema.request.parse({ urls });

    return this.transport.requestData<PluginInstallResultType>({
      path: this.withApiPath(PluginContract.Install.meta.path),
      method: PluginContract.Install.meta.method,
      body: payload,
      signal: requestOptions?.signal
    });
  }

  async listPlugins(
    params: PluginListParamsType = {},
    requestOptions?: ClientRequestOptions
  ): Promise<PluginListType> {
    const query = PluginListParamsSchema.parse(params);

    return this.transport.requestData<PluginListType>({
      path: this.withApiPath(PluginContract.List.meta.path),
      method: PluginContract.List.meta.method,
      query,
      signal: requestOptions?.signal
    });
  }

  async listPluginVersions(
    params: PluginVersionListParamsType,
    requestOptions?: ClientRequestOptions
  ): Promise<PluginVersionListType> {
    const query = PluginVersionListParamsSchema.parse(params);

    return this.transport.requestData<PluginVersionListType>({
      path: this.withApiPath(PluginContract.Versions.meta.path),
      method: PluginContract.Versions.meta.method,
      query,
      signal: requestOptions?.signal
    });
  }

  async listPluginTags(_requestOptions?: ClientRequestOptions): Promise<PluginTagListType> {
    return pluginTagList;
  }

  async getPluginRuntimeConfig(
    pluginId: string,
    requestOptions?: ClientRequestOptions
  ): Promise<PluginRuntimeConfigType> {
    const payload = PluginRuntimeConfigGetParamsSchema.parse({ pluginId });

    return this.transport.requestData<PluginRuntimeConfigType>({
      path: this.withApiPath(PluginContract.RuntimeConfigGet.meta.path),
      method: PluginContract.RuntimeConfigGet.meta.method,
      body: payload,
      signal: requestOptions?.signal
    });
  }

  async setPluginRuntimeConfig(
    pluginId: string,
    config: PluginRuntimeConfigType,
    requestOptions?: ClientRequestOptions
  ): Promise<void> {
    const payload = PluginRuntimeConfigSetParamsSchema.parse({ pluginId, config });

    await this.transport.requestEmpty({
      path: this.withApiPath(PluginContract.RuntimeConfigSet.meta.path),
      method: PluginContract.RuntimeConfigSet.meta.method,
      body: payload,
      signal: requestOptions?.signal
    });
  }

  async resetPluginRuntimeConfig(
    pluginId: string,
    requestOptions?: ClientRequestOptions
  ): Promise<void> {
    const payload = PluginRuntimeConfigResetParamsSchema.parse({ pluginId });

    await this.transport.requestEmpty({
      path: this.withApiPath(PluginContract.RuntimeConfigReset.meta.path),
      method: PluginContract.RuntimeConfigReset.meta.method,
      body: payload,
      signal: requestOptions?.signal
    });
  }

  async createDebugSession(
    params: PluginDebugSessionCreateParamsType,
    requestOptions?: ClientRequestOptions
  ): Promise<PluginDebugSessionCreateResultType> {
    const payload = PluginDebugSessionCreateRequestDTOSchema.parse(params);

    return this.transport.requestData<PluginDebugSessionCreateResultType>({
      path: this.withApiPath(PluginDebugSessionContract.Create.meta.path),
      method: PluginDebugSessionContract.Create.meta.method,
      body: payload,
      signal: requestOptions?.signal
    });
  }

  async refreshDebugSessionKey(
    params: PluginDebugSessionCreateParamsType,
    requestOptions?: ClientRequestOptions
  ): Promise<PluginDebugSessionCreateResultType> {
    const payload = PluginDebugSessionCreateRequestDTOSchema.parse(params);

    return this.transport.requestData<PluginDebugSessionCreateResultType>({
      path: this.withApiPath(PluginDebugSessionContract.RefreshKey.meta.path),
      method: PluginDebugSessionContract.RefreshKey.meta.method,
      body: payload,
      signal: requestOptions?.signal
    });
  }

  async exchangeDebugSessionConnectionKey(
    params: PluginDebugSessionConnectionKeyExchangeParamsType,
    requestOptions?: ClientRequestOptions
  ): Promise<PluginDebugSessionConnectionKeyExchangeResultType> {
    const payload = PluginDebugSessionConnectionKeyExchangeRequestDTOSchema.parse(params);

    return this.transport.requestData<PluginDebugSessionConnectionKeyExchangeResultType>({
      path: this.withApiPath(PluginDebugSessionContract.ExchangeConnectionKey.meta.path),
      method: PluginDebugSessionContract.ExchangeConnectionKey.meta.method,
      body: payload,
      signal: requestOptions?.signal
    });
  }

  async getDebugSessionStatus(
    params: PluginDebugSessionStatusParamsType,
    requestOptions?: ClientRequestOptions
  ): Promise<PluginDebugSessionStatusResultType> {
    const query = PluginDebugSessionGetParamsDTOSchema.parse(params);

    return this.transport.requestData<PluginDebugSessionStatusResultType>({
      path: this.withApiPath(this.withTmbId(PluginDebugSessionContract.Status.meta.path, query.tmbId)),
      method: PluginDebugSessionContract.Status.meta.method,
      signal: requestOptions?.signal
    });
  }

  async revokeDebugSession(
    params: PluginDebugSessionRevokeParamsType,
    requestOptions?: ClientRequestOptions
  ): Promise<PluginDebugSessionRevokeResultType> {
    const payload = PluginDebugSessionRevokeRequestDTOSchema.parse({
      tmbId: params.tmbId,
      reason: params.reason
    });

    return this.transport.requestData<PluginDebugSessionRevokeResultType>({
      path: this.withApiPath(this.withTmbId(PluginDebugSessionContract.Revoke.meta.path, payload.tmbId)),
      method: PluginDebugSessionContract.Revoke.meta.method,
      body: payload,
      signal: requestOptions?.signal
    });
  }

  async runToolStream(
    params: RunToolStreamParams,
    requestOptions?: ClientRequestOptions
  ): Promise<ToolHandlerReturnType> {
    ToolRunInputDTOSchema.parse(params);
    return this.toolRunner.run(params, requestOptions);
  }

  private withApiPath(path: string): string {
    return `/api${path}`;
  }

  private withTmbId(path: string, tmbId: string): string {
    return path.replace(':tmbId', encodeURIComponent(tmbId));
  }
}
