import type { ModelItemType, ModelProviderType } from '@domain/entities/model.entity';
import type { Result } from '@domain/value-objects/result.vo';

export interface ModelManagerPort {
  models(): Promise<Result<ModelItemType[]>>;
  providers(): Promise<Result<ModelProviderType[]>>; // NOTE: 没有包含 AI Proxy 相关的数据，不应该绑定到 AIproxy 上
}
