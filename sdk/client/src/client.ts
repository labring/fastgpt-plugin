import { PluginListParamsSchema } from '@interface-adapter/contracts/dto/plugin.dto';
import {
  PluginConfirmParamsSchema,
  PluginGetParamsSchema,
  PluginInstallDTOSchema,
  PluginRuntimeConfigGetParamsSchema,
  PluginRuntimeConfigSetParamsSchema,
} from '@interface-adapter/contracts/dto/plugin.dto';
import { ToolRunInputDTOSchema } from '@interface-adapter/contracts/dto/tool.dto';
import { ModelContract } from '@interface-adapter/contracts/route/model.contract';
import { PluginContract } from '@interface-adapter/contracts/route/plugin.contract';
import { WorkflowContract } from '@interface-adapter/contracts/route/workflow.contract';

import { RunToolWithStream } from './tool-stream';
import { ClientTransport } from './transport';
import type {
  ClientRequestOptions,
  FastGPTPluginClientOptions,
  ModelListType,
  ModelProviderListType,
  PluginDetailType,
  PluginGetParamsType,
  PluginInstallResultType,
  PluginListParamsType,
  PluginListType,
  PluginPruneDisabledResultType,
  PluginRuntimeConfigType,
  PluginSummaryType,
  PluginTagListType,
  PluginUniqueIdType,
  RunToolStreamParams,
  ToolHandlerReturnType,
  WorkflowListType
} from './types';

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

  async uploadPlugin(
    file: Blob,
    filename?: string,
    requestOptions?: ClientRequestOptions
  ): Promise<PluginSummaryType> {
    const formData = new FormData();
    const defaultName =
      typeof File !== 'undefined' && file instanceof File ? file.name : 'plugin.pkg';
    formData.append('file', file, filename ?? defaultName);

    return this.transport.requestData<PluginSummaryType>({
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

  async getPlugin(
    params: PluginGetParamsType,
    requestOptions?: ClientRequestOptions
  ): Promise<PluginDetailType> {
    const query = PluginGetParamsSchema.parse(params);

    return this.transport.requestData<PluginDetailType>({
      path: this.withApiPath(PluginContract.Get.meta.path),
      method: PluginContract.Get.meta.method,
      query,
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

  async listPluginTags(requestOptions?: ClientRequestOptions): Promise<PluginTagListType> {
    return this.transport.requestData<PluginTagListType>({
      path: this.withApiPath(PluginContract.TagList.meta.path),
      method: PluginContract.TagList.meta.method,
      signal: requestOptions?.signal
    });
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
}
