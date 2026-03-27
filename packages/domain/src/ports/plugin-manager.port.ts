import type { PluginType } from '../entities/plugin.entity';
import type { PluginUniqueIdType } from '../value-objects/plugin.vo';
import type { Result } from '../value-objects/result.vo';

/**
 * PluginManager 抽象工厂,
 * 每个子类实现针对某个 Type 的插件的管理, 且是单例模式
 */
export interface PluginManagerPort<P extends PluginType> {
  /**
   * 注册 Plugin, 缓存插件配置，调用 PluginService
   */
  register(uniqueId: PluginUniqueIdType, config: P): Promise<Result>;

  /**
   * 注销 Plugin,
   * 从缓存中移除插件，
   * 调用 PluginService 关停插件（非阻塞, 不需要等待关停, 拒绝调用服务即可）
   */
  unregister(uniqueId: PluginUniqueIdType): Promise<Result>;

  /**
   * 更新缓存中的插件配置
   * 触发 PluginService 更新操作
   */
  update(uniqueId: PluginUniqueIdType, config: P): Promise<Result>;

  /**
   * 获取插件状态
   */
  status(uniqueId: PluginUniqueIdType): Promise<Result>;

  /**
   * 获取缓存中的所有插件信息
   */
  list(): Promise<Result>;

  /**
   * 优雅关闭，拒绝所有新操作，等待所有插件执行结束
   * 超时则直接关闭
   */
  shutdown(timeout?: number): Promise<Result>;
}
