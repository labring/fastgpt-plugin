<div align="center">
<a href="https://tryfastgpt.ai/"><img src="https://github.com/labring/FastGPT/raw/main/.github/imgs/logo.svg" width="120" height="120" alt="fastgpt logo"></a>

# FastGPT-plugin

<p align="center">
  <a href="./README_zh_CN.md">简体中文</a> |
  <a href="./README.md">English</a>
</p>

[FastGPT](https://github.com/labring/FastGPT) 是一个 AI Agent 构建平台，提供开箱即用的数据处理、模型调用等能力，同时可以通过 Flow 可视化进行工作流编排，从而实现复杂的应用场景！这个仓库是 FastGPT 的插件系统，负责插件的管理以及将插件集成到 FastGPT 系统中。

FastGPT 之前的插件已经迁移到这个仓库，新插件也将在这个仓库中开发。

深度**模块化** FastGPT 以实现最大的**可扩展性**。
</div>



## 路线图

### 基础设施

- [x]  插件管理
- [ ]  插件热插拔
- [ ]  插件上传/网络挂载
- [ ]  可视化调试
- [ ]  反向调用 FastGPT
- [ ]  更多功能

### 模块

当前已实现的模块：

- [x]  系统工具
- [ ]  数据集插件
- [ ]  RAG 插件
- [ ]  更多模块

## 文档

- [系统工具开发指南](https://doc.tryfastgpt.ai/docs/guide/plugins/dev_system_tool)
- [设计文档](https://doc.tryfastgpt.ai/docs/development/design/design_plugin)
