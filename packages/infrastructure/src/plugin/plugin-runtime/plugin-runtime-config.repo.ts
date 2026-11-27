import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';

import type { MongoClient } from '../../storage/mongo';

export type PluginRuntimeConfigRepoDeps = {
  mongoClient: MongoClient;
};

export class PluginRuntimeConfigRepo<T extends object> {
  private default_config: T;
  constructor(
    private deps: PluginRuntimeConfigRepoDeps,
    default_config: T,
    private readonly namespace?: string
  ) {
    this.default_config = default_config;
  }

  private key(pluginId: string): string {
    return this.namespace ? `${this.namespace}:${pluginId}` : pluginId;
  }

  async getPluginRuntimeConfig(pluginId: string): Promise<Result<T>> {
    const result = await this.deps.mongoClient
      .getModel('pluginRuntimeConfig')
      .findOne({
        pluginId: this.key(pluginId)
      })
      .lean();
    if (result) {
      return successResult({ ...this.default_config, ...result.config } as T);
    } else {
      return successResult({ ...this.default_config });
    }
  }

  async savePluginRuntimeConfig(pluginId: string, config: T): Promise<Result> {
    try {
      await this.deps.mongoClient
        .getModel('pluginRuntimeConfig')
        .updateOne({ pluginId: this.key(pluginId) }, { $set: { config } }, { upsert: true });
      return successResult({});
    } catch (error) {
      return failureResult(
        {
          en: 'Save plugin runtime config failed',
          'zh-CN': '保存插件运行时配置失败'
        },
        error
      );
    }
  }

  async resetPluginRuntimeConfig(pluginId: string): Promise<Result<T>> {
    try {
      await this.deps.mongoClient.getModel('pluginRuntimeConfig').deleteOne({ pluginId: this.key(pluginId) });
      return successResult({ ...this.default_config });
    } catch (error) {
      return failureResult(
        {
          en: 'Reset plugin runtime config failed',
          'zh-CN': '重置插件运行时配置失败'
        },
        error
      );
    }
  }
}
