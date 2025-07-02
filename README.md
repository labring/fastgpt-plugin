<div align="center">
<a href="https://tryfastgpt.ai/"><img src="https://github.com/labring/FastGPT/raw/main/.github/imgs/logo.svg" width="120" height="120" alt="fastgpt logo"></a>

# FastGPT-plugin

<p align="center">
  <a href="./README_zh_CN.md">简体中文</a> |
  <a href="./README.md">English</a>
</p>

[FastGPT](https://github.com/labring/FastGPT) is a knowledge-based platform built on the LLMs, offers a comprehensive suite of out-of-the-box capabilities such as data processing, RAG retrieval, and visual AI workflow orchestration, letting you easily develop and deploy complex question-answering systems without the need for extensive setup or configuration.

This repository is the plugin system of FastGPT, which is responsible for the management of plugins and the integration of plugins into the FastGPT system.
The previous plugins of FastGPT have been migrated to this repository, and the new plugins will be developed in this repository.

Deeply **modularize** FastGPT to achieve maximum **extensibility**.
</div>



## Roadmap

### Infrastructure

- [x]  Plugin Management
- [ ]  Plugin Hot-swapping
- [ ]  Plugin Upload/Network Mounting
- [ ]  Visual Debugging
- [ ]  Reverse FastGPT Calls
- [ ]  And more

### Modules

Currently implemented modules:

- [x]  System Tools
- [ ]  Dataset Plugins
- [ ]  RAG Plugins
- [ ]  And more

## Documentation

- [Contributing System Tools](https://doc.tryfastgpt.ai/docs/guide/plugins/dev_system_tool)
- [Design Documentation](https://doc.tryfastgpt.ai/docs/development/design/design_plugin)
