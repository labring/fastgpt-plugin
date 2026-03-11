# FastGPT 插件系统设计

| 项目     | 内容               |
|----------|-------------------|
| 版本     | v1.0.0             |
| 状态     | 重构中              |
| 开发模式 | TDD 测试驱动开发      |

## 插件系统架构图

FastGPT主服务调用 FastGPT Plugin Daemon 服务

```

                                ┌──────────────────────────┐
                                │                          │
┌──────────────────────┐        │                          │
│ FastGPT main service ├───────►│  FastGPT Plugin Daemon   │
└──────────────────────┘        │                          │
                                │                          │
                                └──────────────────────────┘
```

FastGPT Plugin Daemon 服务提供如下功能：
1. 插件生命周期管理：插件文件(`.pkg`文件)的 CRUD
2. 与插件进行通信 IO
3. 管理在本地运行模式下的插件

## FastGPT-Plugin-Daemon

### 运行模式

1. Local Mode: 插件在本地运行。维护一个高性能的进程池。
2. Serverless Mode: 插件在云上运行，依赖 Serverless 平台。
3. Remote Mode: 通过 TCP 连接远端的插件，实时调试。

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

### 2. manifest.yaml 手动描述

使用 `manifest.yaml` 定义描述文件。

## TODO
- [x] 进程池
- [ ] Plugin SDK
