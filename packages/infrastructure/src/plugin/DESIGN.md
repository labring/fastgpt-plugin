# FastGPT Plugin Manager 设计方案

## 需求

1. 支持不同环境下的插件运行:
  1. IPC-based 本地进程池
  2. Serverless 服务
  3. TCP 远程长连接
2. 支持不同类型的插件，包括 tool, model, dataset, workflow 等

## 设计

1. PluginRepo 仓储，调用 s3, mongo 等依赖管理插件等的持久化状态
2. PluginRuntimeManager，管理插件运行时的生命周期, 以及调用入口
3. InvokeManager 反向调用管理器，反向调用逻辑

### 不同类型的插件的管理

1. ToolManager 工具管理，依赖同一个 PluginRuntimeManager
2. ModelManager, 管理模型
3. DatasetSourceManager, 管理知识库信息源
4. WorkflowManager, 应用模版

### Plugin Runtime Drivers

对于不同的运行时的实现，implement 同一个 Port

1. LocalPoolDriver 本地进程池驱动
2. TCPDriver TCP 驱动
3. FCDriver 阿里云 FC 驱动 (TODO)
4. LambdaDriver AWS Lambda 驱动 (TODO)

### Invoke 反向调用
