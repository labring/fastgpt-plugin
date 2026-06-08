# FastGPT 插件系统设计

> 当前文档保留为历史入口。v1.0.0 的详细设计、架构和运行时说明见：
>
> - [插件系统设计文档](./docs/dev/design.zh.md)
> - [项目架构](./docs/dev/architecture.zh.md)
> - [进程池设计文档](./docs/dev/process-pool-design.zh.md)
> - [v1.0.0 更新文档](./docs/upgrade/v1.0.0.zh.md)

| 项目     | 内容               |
|----------|-------------------|
| 版本     | v1.0.0             |
| 状态     | 重构中              |
| 开发模式 | TDD 测试驱动开发      |

## 插件系统架构图

FastGPT 主服务调用 FastGPT Plugin 服务。

```

                                ┌──────────────────────────┐
                                │                          │
┌──────────────────────┐        │                          │
│ FastGPT main service ├───────►│   FastGPT Plugin Server  │
└──────────────────────┘        │                          │
                                │                          │
                                └──────────────────────────┘
```

FastGPT Plugin 服务提供如下功能：
1. 插件生命周期管理：插件文件(`.pkg`文件)的 CRUD
2. 与插件进行通信 IO
3. 管理在本地运行模式下的插件

## FastGPT-Plugin-Daemon

### 运行模式

1. local-pool：当前默认运行时，插件在本地子进程池中运行。
2. serverless：预留运行时，插件运行在 Serverless 平台。
3. tcp：预留调试运行时，通过 TCP 连接远端插件。

## 插件设计

插件有多种类型：
- tool 系统工具，包括工具集
- dataset 知识库
- workflow 工作流
- model 模型
- trigger 触发器（未实现）

统一打包封装为 ".pkg" 格式（zip后rename）

### 1. 通用的 IO 逻辑

封装一套通用的 IO 逻辑（适配器模式）:
- 适配 Local 模式下的 IPC 通信
- Serverless 下的通信
- Remote 下的 TCP 通信。

### 2. manifest 描述

插件 manifest 由 `@fastgpt-plugin/sdk-factory` 的 `defineTool()` 或 `defineToolSet()` 生成，构建后写入 `dist/manifest.json`。

## TODO
- [x] 进程池
- [x] Plugin SDK
