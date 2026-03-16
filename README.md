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
- [ ] RAG Algorithm
- [ ] Agent Strategy
- [ ] Third-party Integration

## System Tool Features

- [x] Independent tool execution
- [ ] Hot-swappable plugins
- [ ] Secure and elegant secret configuration
- [ ] Visual debugging support
- [ ] Reverse invocation of FastGPT
- [ ] Plugin version management
- [ ] SSE streaming response support
- [ ] Enhanced security policies

## New Plugins

### Alibaba Cloud Document Parse (aliDocParse)

Parse online documents using Alibaba Cloud Document Mind. Extracts text, layout, and style information and returns the raw parsed JSON.

**Supported formats:** PDF, Word (.docx/.doc), Excel (.xlsx/.xls), HTML, EPUB, MOBI, Markdown, TXT, and more.

### Alibaba Cloud OCR (aliOcr)

Perform OCR on images or PDFs using Alibaba Cloud OCR, covering 70 recognition types in a single plugin. Supports general text, ID cards, invoices, business licenses, vehicles, education, and multilingual scenarios. Each option in the dropdown indicates whether PDF input is supported.

### Azure Flux Image Generation (azureFlux)

Generate high-quality images via an Azure-deployed Flux model.

---

## Documentation & Development Guides

- [Plugin design document](https://doc.tryfastgpt.ai/docs/introduction/development/design/design_plugin)
- [System tool development guide](https://doc.tryfastgpt.ai/docs/introduction/guide/plugins/dev_system_tool)
- [Development Specifications](./dev.md)
