<div align="center">
<a href="https://tryfastgpt.ai/"><img src="https://github.com/labring/FastGPT/raw/main/.github/imgs/logo.svg" width="120" height="120" alt="fastgpt logo"></a>

# FastGPT-plugin

<p align="center">
  <a href="./README_zh_CN.md">简体中文</a> |
  <a href="./README.md">English</a>
</p>

[FastGPT](https://github.com/labring/FastGPT) is a knowledge-based platform built on the LLMs, offers a comprehensive suite of out-of-the-box capabilities such as data processing, RAG retrieval, and visual AI workflow orchestration, letting you easily develop and deploy complex question-answering systems without the need for extensive setup or configuration.

The system tools previously utilized in FastGPT have been migrated to this repository, and future development of new tools will also be conducted within this repository.

Deeply **modularize** FastGPT to achieve maximum **extensibility**.
</div>

## Expansion Modules

- [x] System Tools
- [x] App templates
- [x] Model presets
- [ ] RAG Algorithm
- [ ] Agent Strategy
- [ ] Third-party Integration

## System Tool Features

- [x] Independent tool execution
- [x] Hot-swappable plugins
- [x] Plugin version management
- [x] SSE streaming response support
- [x] Local plugin debugging
- [x] Reverse invocation of FastGPT host capabilities
- [x] URL install SSRF protection
- [ ] More plugin types beyond tools

## Documentation & Development Guides

- [Development Specifications](./dev.md)
- [v1.0.0 Upgrade Guide](./docs/upgrade/v1.0.0.md)
- [Architecture](./docs/dev/architecture.md)
- [Plugin System Design](./docs/dev/design.md)
- [System Plugin Development Guide](./docs/dev/how-to-devlop-plugin.en.md)
- [Local Pool Runtime Design](./docs/dev/process-pool-design.md)
- [Runtime Metrics OpenTelemetry](./docs/dev/runtime-metrics-otel.md)
- [CLI Guide](./apps/cli/README.en.md)
- [SDK Factory Guide](./sdk/factory/README.en.md)
