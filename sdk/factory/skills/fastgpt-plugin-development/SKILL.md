---
name: fastgpt-plugin-development
description: Use as the entry skill when a user wants to develop a FastGPT plugin. Identify the plugin category, then route to the matching specialized skill such as fastgpt-system-tool-development.
---

# FastGPT 插件开发入口

在用户要开发 FastGPT 插件时先使用这个 skill。它只负责判断插件类型和选择后续规范，具体实现规则放在对应专项 skill 中。

## 类型判断

先确认用户要开发的插件类型：

- 系统工具：通过 `@fastgpt-plugin/sdk-factory` 暴露 `defineTool()` 或 `defineToolSet()`，由 FastGPT 作为工具调用。
- 其他插件类型：按后续新增的专项 skill 处理。

当前已支持：

- `fastgpt-system-tool-development`: 系统工具插件开发规范，文件位于 `../fastgpt-system-tool-development/SKILL.md`。

## 路由规则

- 用户提到系统工具、tool、tool-suite、工具调用、`defineTool()`、`defineToolSet()`、`createToolHandler()` 时，继续读取 `../fastgpt-system-tool-development/SKILL.md`。
- 用户只说“开发插件”且没有说明类型时，先根据需求判断是否属于系统工具；能判断时直接进入对应专项 skill。
- 无法判断插件类型时，先询问用户插件要暴露成哪类能力，再进入对应专项 skill。

## 通用原则

- 入口 skill 不承载具体插件代码模板。
- 专项 skill 负责说明插件怎么写、目录包含哪些内容、通过什么工具写和验证。
- 新增插件类型时，在这里补一条类型说明和对应 skill 名称。
