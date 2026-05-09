# SoMark 文档解析

SoMark 文档解析工具用于将 PDF、图片、Office 文档等文件解析为结构化结果，并返回 Markdown 全文和 JSON 数据。工具适用于知识库入库、文档问答预处理、合同/报告解析、表格和公式抽取等场景。

## 使用方式

在 FastGPT 工作流中添加 `SoMark 文档解析` 工具，选择一个文件，并按实际部署方式填写密钥配置。

### 密钥配置

| 字段 | 说明 |
| --- | --- |
| 部署方式 | 选择 `SoMark API` 或 `SoMark Self-host`。 |
| API Key | 使用 SoMark API 时必填，需以 `sk-` 开头；SoMark Self-host 无需填写。 |
| Base URL | 使用 SoMark API 时必须填写 `https://somark.tech/api/v1`；SoMark Self-host 时填写包含 API 路径前缀的服务地址（如 `https://somark.internal/api/v1`），工具会在该地址后拼接对应的接口路径。 |

两种部署模式调用的接口不同：

- **SoMark API**：请求 `${baseUrl}/parse/sync`
- **SoMark Self-host**：请求 `${baseUrl}/extract`

因此 Self-host 的 Base URL 必须填写到正确的 API 前缀位置，确保拼接后能命中真实的 `/extract` 接口。

### 输入参数

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 文件 | 文件数组 | 无 | 必填，只支持选择 1 个文件。 |
| 输出格式 | 多选 | `json`, `markdown` | 选择返回 JSON、Markdown，或同时返回两种格式。 |
| 图片格式 | 单选 | `url` | 图片元素返回格式，支持 `url`、`base64`、`none`。 |
| 公式格式 | 单选 | `latex` | 公式元素返回格式，支持 `latex`、`mathml`、`ascii`。 |
| 表格格式 | 单选 | `html` | 表格元素返回格式，支持 `markdown`、`html`、`image`。 |
| 化学结构式格式 | 单选 | `image` | 当前仅支持 `image`。 |
| 文字跨页拼接 | 开关 | `false` | 将跨页文字段合并为连续段落。 |
| 表格跨页拼接 | 开关 | `false` | 将跨页表格合并为完整表格。 |
| 标题层级识别 | 开关 | `false` | 识别 H1、H2、H3 等标题层级。 |
| 文中图 | 开关 | `true` | 返回文字段落中的图片。 |
| 表格图 | 开关 | `true` | 返回表格单元格内的图片。 |
| 图片理解 | 开关 | `true` | 对文档内图片进行语义理解和结构化描述。 |
| 保留页眉页脚 | 开关 | `false` | 开启后保留页眉页脚内容。 |

### 输出结果

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| Markdown | 字符串 | Markdown 格式全文。未选择 Markdown 输出时为空字符串。 |
| JSON | 对象 | JSON 格式解析结果。未选择 JSON 输出时为空对象。 |

## 注意事项

- FastGPT 文件选择器传入的是文件下载 URL，工具会先下载文件，再以 multipart form-data 方式发送到 SoMark。
- 如果下载 URL 带有 `filename` 查询参数，工具会优先使用该文件名，避免临时下载地址丢失 `.pdf`、`.docx` 等后缀导致上游误判文件类型。
- 使用 SoMark API 时必须填写 API Key，且需以 `sk-` 开头。
- 使用 SoMark Self-host 时不会发送 `api_key` 字段。
