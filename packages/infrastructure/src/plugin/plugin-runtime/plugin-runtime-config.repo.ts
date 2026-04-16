import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';

import type { MongoClient } from '../../storage/mongo';

export type PluginRuntimeConfigRepoDeps = {
  mongoClient: MongoClient;
};

export class PluginRuntimeConfigRepo<T extends object> {
  private default_config: T;
  constructor(
    private deps: PluginRuntimeConfigRepoDeps,
    default_config: T
  ) {
    this.default_config = default_config;
  }

  async getPluginRuntimeConfig(pluginId: string): Promise<Result<T>> {
    const result = await this.deps.mongoClient
      .getModel('pluginRuntimeConfig')
      .findOne({
        pluginId
      })
      .lean();
    if (result) {
      return successResult({ ...this.default_config, ...result.config } as T);
    } else {
      return successResult(this.default_config);
    }
  }

  async savePluginRuntimeConfig(pluginId: string, config: T): Promise<Result> {
    try {
      await this.deps.mongoClient
        .getModel('pluginRuntimeConfig')
        .updateOne({ pluginId }, { $set: { config } }, { upsert: true });
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
}
