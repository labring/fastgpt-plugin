<div align="center">
<a href="https://tryfastgpt.ai/"><img src="https://github.com/labring/FastGPT/raw/main/.github/imgs/logo.svg" width="120" height="120" alt="fastgpt logo"></a>

# FastGPT-plugin

<p align="center">
  <a href="./README_zh_CN.md">简体中文</a> |
  <a href="./README.md">English</a>
</p>

[FastGPT](https://github.com/labring/FastGPT) 是一个 AI Agent 构建平台，提供开箱即用的数据处理、模型调用等能力，同时可以通过 Flow 可视化进行工作流编排，从而实现复杂的应用场景！这个仓库是 FastGPT 的插件系统，负责插件的管理以及将插件集成到 FastGPT 系统中。

FastGPT 已有系统工具已经迁移到这个仓库，新工具也将在这个仓库中开发。

深度**模块化** FastGPT 以实现最大的**可扩展性**。
</div>

## 扩展模块

- [x]  系统工具
- [x]  App 模板
- [x]  模型预设
- [ ]  RAG 算法
- [ ]  Agent 策略
- [ ]  第三方接入

## 系统工具基础设施

- [x]  工具独立运行
- [x]  热插拔
- [x]  工具版本管理
- [x]  SSE 流响应
- [x]  本地插件调试
- [x]  反向调用 FastGPT 宿主能力
- [x]  URL 安装 SSRF 防护
- [ ]  工具以外的更多插件类型

## 文档

- [开发规范](./dev_zh_CN.md)
- [v1.0.0 更新文档](./docs/upgrade/v1.0.0.zh.md)
- [项目架构](./docs/dev/architecture.zh.md)
- [插件系统设计](./docs/dev/design.zh.md)
- [Connection Gateway 设计](./docs/dev/connection-gateway-design.zh.md)
- [系统插件开发指南](./docs/dev/how-to-devlop-plugin.md)
- [进程池运行时设计](./docs/dev/process-pool-design.zh.md)
- [Runtime Metrics OpenTelemetry](./docs/dev/runtime-metrics-otel.zh.md)
- [CLI 使用指南](./apps/cli/README.md)
- [SDK Factory 使用指南](./sdk/factory/README.md)
