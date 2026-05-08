# SoMark 文档解析设计文档

## 目标

将 FastGPT 工作流中的单个文件交给 SoMark 文档解析服务处理，并把解析结果映射为稳定的 FastGPT 工具输出：

- `markdown`：Markdown 格式全文。
- `json`：结构化 JSON 结果。

工具同时支持 SoMark 官方 API 和私有化部署，避免把官方 API 的认证要求强加给私有化场景。

## 工具形态

- 工具 ID：`SoMarkDocumentParser`
- 包路径：`modules/tool/packages/SoMarkDocumentParser`
- 类型：独立工具，不是工具集。
- 入口：
  - `config.ts`：声明 FastGPT 工具配置、密钥配置、输入输出配置。
  - `src/index.ts`：声明 Zod 输入输出 schema 和工具运行逻辑。
  - `index.ts`：通过 `exportTool` 绑定配置、schema 和回调。

## 密钥配置

`secretInputConfig` 包含三个字段：

| key | inputType | required | 说明 |
| --- | --- | --- | --- |
| `deploymentType` | `select` | `true` | `api` 表示 SoMark 官方 API，`private` 表示私有化部署。 |
| `apiKey` | `secret` | `false` | 官方 API 模式使用，私有化部署不使用。 |
| `baseUrl` | `input` | `false` | 私有化部署时填写；官方 API 模式留空时使用默认地址。 |

当前 FastGPT 激活表单的 `secretInputConfig` 协议没有条件展示和条件必填能力，因此 `apiKey` 和 `baseUrl` 在配置层都保持非必填。真正的模式校验在运行时完成。

## 运行时校验

运行时逻辑以 `deploymentType` 为核心分支：

1. `deploymentType === 'api'`
   - `baseUrl` 为空时使用默认地址 `https://somark.tech/api/v1`。
   - `baseUrl` 非空时必须等于默认官方地址，避免官方 API 模式误连私有网关。
   - `apiKey.trim()` 不能为空。
   - 请求体会追加 `api_key`。

2. `deploymentType === 'private'`
   - `baseUrl.trim()` 不能为空。
   - 不发送 `api_key`。

文件输入为空时直接报错，不继续下载或调用 SoMark。

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

1. 优先读取下载 URL 的 `filename` 查询参数。
2. 没有 `filename` 时读取 URL path 的最后一段。
3. 仍无法解析时使用 `document`。

这样处理的原因是 FastGPT 私有文件下载地址通常类似：

```text
/api/system/file/download/<token>?filename=<real-file-name>.pdf
```

如果只读取 path，传给 SoMark 的文件名会变成 token，缺少 `.pdf`、`.docx` 等后缀，部分上游服务会据此误判为不支持的文件类型。

## SoMark 请求

工具调用：

```text
POST /parse/sync
```

请求配置：

- `baseURL`：运行时解析后的官方或私有化地址。
- `headers: {}`：覆盖默认 JSON Content-Type，让 multipart form-data 自动生成边界。
- `timeout: 120_000`
- `retries: 1`

表单字段：

| 字段 | 来源 |
| --- | --- |
| `file` | 下载后的 `Blob` 和解析出的文件名。 |
| `api_key` | 仅官方 API 模式追加。 |
| `output_formats` | `outputFormats` 数组，每个值追加一次。 |
| `element_formats` | 图片、公式、表格、化学结构式格式配置的 JSON 字符串。 |
| `feature_configs` | 跨页拼接、标题识别、图片理解、页眉页脚等开关配置的 JSON 字符串。 |

## 响应映射

SoMark 响应中非 0 `code` 被视为业务错误：

```ts
throw new Error(`SoMark API error: ${detail}`)
```

输出映射规则：

- 选择了 `markdown` 时返回 `data.result.outputs.markdown ?? ''`，否则返回空字符串。
- 选择了 `json` 时返回 `data.result.outputs.json ?? {}`，否则返回空对象。
- SoMark 返回缺失 `outputs` 时，工具仍返回声明过的空输出，避免下游节点拿到 `undefined`。

## 测试覆盖

测试文件：`test/index.test.ts`

重点覆盖：

- multipart 请求字段和输出映射。
- 官方 API 和私有化部署的认证差异。
- 官方 API 模式下 Base URL 留空时使用默认地址。
- 私有化部署不发送 `api_key`。
- 文件 URL 的 `filename` 查询参数优先级，避免下载 token 被当作文件名。
- 未选择的输出格式返回空值。
- 文件下载失败和 SoMark 业务错误透传。

运行命令：

```bash
bun run test -- modules/tool/packages/SoMarkDocumentParser/test/index.test.ts
```

注意：本仓库测试通过 Vitest 运行，不使用 `bun test`。

## 兼容性约束

- 运行时代码只使用标准 Node.js/浏览器兼容 API：`fetch`、`Blob`、`FormData`、`URL`。
- 不使用 Bun 专有 API，保证构建后可在 Node.js v22 生产环境运行。
- 不在工具函数顶层包裹通用 `try/catch`，未知错误交给框架处理。
