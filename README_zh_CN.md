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
- [ ]  RAG 算法
- [ ]  Agent 策略
- [ ]  第三方接入

## 系统工具基础设施

- [x]  工具独立运行
- [x]  热插拔
- [x]  工具版本管理
- [x]  SSE 流响应
- [ ]  更优雅的 Secret 配置
- [ ]  可视化调试
- [ ]  反向调用 FastGPT
- [ ]  更多安全策略

## 新增插件

### 阿里云文档智能解析（aliDocParse）

使用阿里云文档智能（Document Mind）对在线文档进行版式解析，提取文本、布局和样式信息，返回原始解析 JSON。

**支持格式：** PDF、Word（.docx/.doc）、Excel（.xlsx/.xls）、HTML、EPUB、MOBI、Markdown、TXT 等。

**输入参数：**
- `AccessKey ID` / `AccessKey Secret`：阿里云访问凭证
- `文档 URL`：需要解析的文档公网地址（最大 150MB，15000 页）
- `文件类型`：文档格式（下拉选择）

**输出：** 原始解析 JSON，包含 layouts、styles、docInfo 等字段。

---

### 阿里云 OCR 文字识别（aliOcr）

使用阿里云文字识别（OCR）对图片或 PDF 进行智能识别，通过单一插件覆盖 70 种识别场景。

**识别类型（下拉选择，按场景分组）：**

| 分类 | 包含类型 |
|------|----------|
| 统一识别 | 通用票证抽取（支持 PDF） |
| 通用文字 | 全文识别高精版、通用文字识别、手写体、表格、文档结构化等 |
| 个人证照 | 身份证、护照（中国/国际）、户口本、银行卡、社保卡、港澳台通行证等 |
| 票据凭证 | 增值税发票、混贴发票、航空行程单、火车票、定额发票、二手车发票等（部分支持 PDF） |
| 企业资质 | 营业执照、食品/医疗/化妆品许可证、商标注册证、国际企业执照等 |
| 车辆物流 | 行驶证、驾驶证、车牌、VIN 码、电子面单等 |
| 教育场景 | 数学公式、试卷识别、口算判题等 |
| 小语种 | 英语、日语、韩语、泰语、俄语、拉丁语等 |
| 医疗场景 | 核酸检测报告 |

**输入参数：**
- `AccessKey ID` / `AccessKey Secret`：阿里云访问凭证
- `文件 URL`：图片或 PDF 的公网地址（最大 10MB）
- `识别类型`：下拉选择（共 70 种，标注支持格式）

**输出：** 阿里云返回的原始结构化 JSON 数据。

---

### Azure Flux 图像生成（azureFlux）

通过 Azure 部署的 Flux 模型生成高质量图像。

**输入参数：**
- `Endpoint` / `API Key`：Azure 部署端点与访问密钥
- `提示词（Prompt）`：图像描述文本

**输出：** 生成的图像（Base64 或 URL）。

---

## 文档

- [系统工具开发指南](https://doc.fastgpt.io/docs/introduction/guide/plugins/dev_system_tool)
- [设计文档](https://doc.fastgpt.io/docs/introduction/development/design/design_plugin)
- [开发规范](./dev_zh_CN.md)
