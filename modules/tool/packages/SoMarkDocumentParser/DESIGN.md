# SoMark 文档解析设计文档

## 目标

将 FastGPT 工作流中的单个文件交给 SoMark 文档解析服务处理，并把解析结果映射为稳定的 FastGPT 工具输出：

- `markdown`：Markdown 格式全文。
- `json`：结构化 JSON 结果。

工具同时支持 SoMark API 和 SoMark Self-host，两种模式在接口路径、鉴权方式、响应壳上都有差异，由运行时分支统一处理。

## 工具形态

- 工具 ID：`SoMarkDocumentParser`
- 包路径：`modules/tool/packages/SoMarkDocumentParser`
- 类型：独立工具，非工具集
- 入口文件：
  - `config.ts`：FastGPT 工具配置、密钥配置、输入输出声明
  - `src/index.ts`：Zod schema 与运行逻辑
  - `index.ts`：通过 `exportTool` 绑定 config、schema、回调

## 密钥配置

`secretInputConfig` 包含三个字段：

| key | inputType | required | 说明 |
| --- | --- | --- | --- |
| `deploymentType` | `select` | `true` | `api` 表示 SoMark API，`private` 表示 SoMark Self-host。 |
| `baseUrl` | `input` | `true` | SoMark API 模式必须为 `https://somark.tech/api/v1`，Self-host 模式填写包含 API 路径前缀的服务地址。 |
| `apiKey` | `secret` | `false` | SoMark API 模式必填且需以 `sk-` 开头，Self-host 模式不使用。 |

`secretInputConfig` 协议没有条件必填能力，`apiKey` 在 SoMark API 模式下事实上必填，但配置层只能保持非必填，真正的模式相关校验在运行时完成。

## 运行时校验

运行时按 `deploymentType` 分支校验，校验未通过直接抛错，不发起任何网络请求：

通用校验：

- `file[0]` 为空 → 抛 `File path is required`
- `baseUrl.trim()` 为空 → 抛 `Base URL is required`
- 去除 `baseUrl` 末尾多余的斜杠

`deploymentType === 'api'`：

- `baseUrl` 必须严格等于 `https://somark.tech/api/v1`，否则抛 `Base URL or API Key is invalid, ...`
- `apiKey.trim()` 必须以 `sk-` 开头，否则抛同一条错误信息（与 baseUrl 错误共用提示，避免泄露具体校验细节）
- 请求体会追加 `api_key`

`deploymentType === 'private'`：

- `baseUrl` 已在通用校验中确认非空
- 不发送 `api_key`

## 文件处理

FastGPT 的 `fileSelect` 输入以字符串数组传入文件下载 URL，本工具只接受 1 个文件：

```ts
file: z.array(z.string()).length(1, 'file is required')
```

工具使用标准 `fetch` 下载文件，并将响应体转为 `Blob` 后追加到 `FormData`：

```ts
form.append('file', blob, filename)
```

文件名按以下顺序解析：

1. 优先读取下载 URL 的 `filename` 查询参数
2. 没有 `filename` 时读取 URL path 的最后一段
3. 仍无法解析时使用 `document`

这样处理的原因是 FastGPT 私有文件下载地址通常类似：

```text
/api/system/file/download/<token>?filename=<real-file-name>.pdf
```

如果只读取 path，传给 SoMark 的文件名会变成 token，缺少 `.pdf`、`.docx` 等后缀，部分上游服务会据此误判为不支持的文件类型。

## SoMark 请求

接口路径按部署模式分支：

| deploymentType | 路径 |
| --- | --- |
| `api` | `POST /parse/sync` |
| `private` | `POST /extract` |

请求配置：

- `baseURL`：运行时校验后的 baseUrl
- `headers: {}`：显式覆盖默认 JSON Content-Type，让 multipart form-data 自动生成 boundary
- `timeout: 120_000`
- `retries: 1`

表单字段：

| 字段 | 来源 |
| --- | --- |
| `file` | 下载后的 `Blob` 与解析出的文件名 |
| `api_key` | 仅 SoMark API 模式追加 |
| `output_formats` | `outputFormats` 数组，每个值独立 append 一次 |
| `element_formats` | 图片、公式、表格、化学结构式格式配置的 JSON 字符串 |
| `feature_configs` | 跨页拼接、标题识别、图片理解、页眉页脚等开关的 JSON 字符串 |

## 响应映射

两种部署的响应外层字段一致（`code`、`message`），但 outputs 嵌套层级不同，需要按部署模式分别取值：

| deploymentType | outputs 路径 |
| --- | --- |
| `api` | `data.data.result.outputs` |
| `private` | `data.outputs` |

错误判断对两种模式共用：

- `data.code !== 0` 视为业务错误，按以下优先级拼装错误详情：
  1. `data.data.error`（仅当为字符串）
  2. `data.message`
  3. `unknown error`
  并抛出 `SoMark API error: ${detail}`
- outputs 缺失时抛 `SoMark response has no outputs`，避免静默把空内容当成功

输出映射规则：

- 用户勾选 `markdown` 时返回 `outputs.markdown ?? ''`，否则返回空字符串
- 用户勾选 `json` 时返回 `outputs.json ?? {}`，否则返回空对象

## 测试覆盖

测试文件：`test/index.test.ts`

重点覆盖：

- multipart 请求字段构造与输出映射
- SoMark API 与 Self-host 模式各自的鉴权与接口路径差异
- SoMark API 模式下 baseUrl / apiKey 校验失败路径
- Self-host 模式不发送 `api_key`
- 文件 URL 的 `filename` 查询参数优先级，避免下载 token 被当作文件名
- 未选择的输出格式返回空值
- 文件下载失败、`code !== 0`、outputs 缺失等异常路径

运行命令：

```bash
bun run test -- modules/tool/packages/SoMarkDocumentParser/test/index.test.ts
```

本仓库测试由 Vitest 驱动，不使用 `bun test`。

## 兼容性约束

- 运行时代码只使用标准跨运行时 API：`fetch`、`Blob`、`FormData`、`URL`
- 不依赖 Bun 专有 API，构建产物可在 Node.js v22 生产环境运行
- 不在工具函数顶层包裹兜底 `try/catch`，未知错误交给框架统一处理
