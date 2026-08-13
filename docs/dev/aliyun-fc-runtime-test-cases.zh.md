# 阿里云 FC 插件运行时测试用例

## 当前实现状态

更新时间：2026-05-22 Asia/Shanghai

当前已完成 v0 vertical slice 的本地实现：

- `FCPluginRuntimeManager` 已实现 `PluginRuntimeManagerPort` 的注册、注销、配置、状态、调用和关闭路径。
- FC artifact repo 已支持把 active 插件 `index.js` 发布到 FC 专用 OSS key。
- FC function provider 已拆成抽象 provider、内存测试 provider、HTTP provider 和 Aliyun SDK provider。
- request signature 已支持 timestamp、runtime id、invocation id、body hash、HMAC 签名和 replay 防护。
- `packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC/runtime` 已提供 HTTP bootstrap、artifact loader、handler 执行和 NDJSON frame 输出。
- `PLUGIN_RUNTIME_MODE=serverless-fc` 已接入 `apps/server/src/deps.ts`。
- 已补齐 infrastructure 层的 env、命名、签名、artifact、registry、invoker、manager 单元测试。
- 已提供手动构建并推送 runtime image 到阿里云 ACR 的 GitHub Actions workflow。

仍待补齐：

- `packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC/runtime` 的 runtime 进程级单元测试。
- 真实阿里云 FC + OSS staging smoke test。
- RAM policy、FC/OSS 部署模板文档。
- artifact 历史版本保留与自动清理策略。

## 已通过验证

```bash
pnpm exec tsc --noEmit
pnpm exec vitest run packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC packages/infrastructure/src/env/index.test.ts
pnpm exec vitest run packages/infrastructure/src/plugin/plugin-runtime/drivers/local-pool packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC packages/infrastructure/src/plugin/tool.impl.test.ts packages/infrastructure/src/env/index.test.ts
```

最后一次记录结果：

- TypeScript 编译通过。
- FC + env 单测：8 个测试文件，26 个用例通过。
- local-pool 兼容回归 + FC + ToolFactory 相关测试：14 个测试文件，46 个用例通过。

## 测试环境

本地单元测试前置条件：

- 已执行 `pnpm install --no-frozen-lockfile`。
- 不需要真实阿里云凭证；Aliyun provider 通过 fake provider 或 mock client 验证配置映射和行为。
- `NODE_ENV=test` 下允许使用测试 signing secret。

Staging smoke test 前置条件：

- 已发布 `fastgpt-plugin-fc-runtime:<tag>` runtime image。
- 已准备 FC artifact OSS bucket，并配置最小权限 RAM role。
- 已配置 FC service/function 所需 VPC、vSwitch、security group。
- API server 能访问 FastGPT invoke API，FC runtime 能访问 API server。
- 使用测试插件 `getTime` 或等价官方 JS 插件作为最小验证对象。

示例 staging 环境变量，真实密钥通过部署平台 secret 注入：

```env
PLUGIN_RUNTIME_MODE=serverless-fc
FC_REGION=cn-hangzhou
FC_ENDPOINT=https://123456789.cn-hangzhou.fc.aliyuncs.com
FC_ACCOUNT_ID=123456789
FC_RUNTIME_IMAGE=registry.cn-hangzhou.aliyuncs.com/fastgpt/fastgpt-plugin-fc-runtime:2026-05-22
FC_FUNCTION_NAME_PREFIX=fastgpt-plugin
FC_INVOCATION_MODE=openapi-buffered
FC_ROLE_ARN=acs:ram::123456789:role/fastgpt-plugin-fc-runtime
FC_VPC_ID=vpc-xxx
FC_VSWITCH_IDS=vsw-xxx
FC_SECURITY_GROUP_ID=sg-xxx
FC_ARTIFACT_REGION=cn-hangzhou
FC_ARTIFACT_BUCKET=fastgpt-plugin-runtime-artifacts
FC_ARTIFACT_PREFIX=plugin-runtime
FC_ARTIFACT_ACCESS_KEY_ID=<secret-from-secret-manager>
FC_ARTIFACT_ACCESS_KEY_SECRET=<secret-from-secret-manager>
FC_DEFAULT_DISK_SIZE=512
FC_INVOKE_SIGNING_SECRET=<secret-from-secret-manager>
```

## 单元测试用例

| ID | 覆盖对象 | 状态 | 前置条件 | 步骤 | 预期结果 |
| --- | --- | --- | --- | --- | --- |
| FC-ENV-001 | `packages/infrastructure/src/env/index.ts` | 已覆盖 | `PLUGIN_RUNTIME_MODE=localPool` | 解析未配置 FC 变量的 env | FC 变量保持 optional，不影响 local-pool 启动 |
| FC-ENV-002 | `packages/infrastructure/src/env/index.ts` | 已覆盖 | `PLUGIN_RUNTIME_MODE=serverless-fc` | 缺少 FC 必填变量时解析 env | 返回明确配置错误 |
| FC-ENV-003 | `packages/infrastructure/src/env/index.ts` | 已覆盖 | `NODE_ENV=production` | 使用弱 `FC_INVOKE_SIGNING_SECRET` | 拒绝启动并提示 signing secret 过弱 |
| FC-ENV-004 | `packages/infrastructure/src/env/index.ts` | 已覆盖 | `PLUGIN_RUNTIME_MODE=serverless` | 解析旧 runtime mode | 归一化为 `serverless-fc`，兼容已有部署配置 |
| FC-TYPE-001 | `types.ts` | 已覆盖 | 默认配置 | 解析 `FCPluginConfigSchema` | 得到默认 timeout、concurrency、memory、disk、cpu 和 queue 配置 |
| FC-PROVIDER-001 | `fc-aliyun-function-provider.ts` | 已覆盖 | custom-container 函数定义 | 构造阿里云 CreateFunction input | 请求包含显式 `diskSize`，避免 FC 拒绝创建函数 |
| FC-PROVIDER-002 | `fc-aliyun-function-provider.ts` | 已覆盖 | FC invoke input | 构造带签名 envelope 的阿里云 InvokeFunction body stream | stream 仅输出 `Buffer` chunk；runtime 解包后的原始 body 和签名可通过校验，且不依赖 FC 转发自定义 headers |
| FC-PROVIDER-003 | `fc-aliyun-function-provider.ts` | 已覆盖 | FC endpoint 首次连接超时 | 调用 InvokeFunction | 仅对连接建立前的 `ConnectTimeout` 重试一次，并为重试重建 body stream |
| FC-RUNTIME-ENV-001 | `runtime/src/env.ts` | 已覆盖 | API server 配置 `FC_INVOKE_SIGNING_SECRET` | 构造函数定义并解析 runtime env | 函数容器使用 `FASTGPT_INVOKE_SIGNING_SECRET`，避开阿里云保留的 `FC_*` 前缀 |
| FC-RUNTIME-ENV-002 | `runtime/src/env.ts`、`runtime/src/artifact.ts` | 已覆盖 | API server 配置 `FC_ARTIFACT_REGION` 和 artifact OSS AK/SK | 构造函数定义并初始化 artifact downloader | server 配置映射为 `FASTGPT_ARTIFACT_*`，runtime 使用映射后的 region 和凭证下载 artifact |
| FC-TYPE-002 | `types.ts` | 已覆盖 | 非法配置 | 输入负数 timeout 或非法 invocation mode | schema 校验失败 |
| FC-NAME-001 | `function-name.ts` | 已覆盖 | 合法 plugin id、version、etag | 生成 runtime id 和 function name | 名称稳定、可推导、符合 FC 命名约束 |
| FC-NAME-002 | `function-name.ts` | 已覆盖 | 超长 plugin id | 生成 function name | 名称被截断并带稳定 hash suffix |
| FC-NAME-003 | `function-name.ts` | 已覆盖 | 空 plugin id 或空 etag | 生成 runtime id | 返回参数错误 |
| FC-SIG-001 | `fc-request-signature.ts` | 已覆盖 | 合法 secret 和 body | 签名后立即验证 | 验证通过，返回 invocation id |
| FC-SIG-002 | `fc-request-signature.ts` | 已覆盖 | 已签名请求 | 修改 body 后验证 | 拒绝 body tamper |
| FC-SIG-003 | `fc-request-signature.ts` | 已覆盖 | 过期 timestamp | 验证签名 | 拒绝 expired request |
| FC-SIG-004 | `fc-request-signature.ts` | 已覆盖 | 同一 invocation id | 连续验证两次 | 第二次拒绝 replay |
| FC-SIG-005 | `fc-request-signature.ts` | 已覆盖 | runtime id 不匹配 | 用其他 runtime id 验证 | 拒绝 runtime mismatch |
| FC-ART-001 | `fc-runtime-artifact.repo.ts` | 已覆盖 | plugin id、version、etag | 生成 artifact key | key 为 `plugin-runtime/<pluginId>/<version>/<etag>/index.js` |
| FC-ART-002 | `fc-runtime-artifact.repo.ts` | 已覆盖 | OSS object 已存在且 metadata 匹配 | 执行 `ensureArtifact()` | 不重复上传，返回 existing artifact |
| FC-ART-003 | `fc-runtime-artifact.repo.ts` | 已覆盖 | `PluginRepo` 返回 active `index.js` | 执行 `ensureArtifact()` | 上传到 FC artifact OSS 并返回 key、etag、size |
| FC-ART-004 | `fc-runtime-artifact.repo.ts` | 已覆盖 | 缺少 active `index.js` | 执行 `ensureArtifact()` | 返回 artifact publish 错误 |
| FC-ART-005 | `fc-runtime-artifact.repo.ts` | 已覆盖 | prefix 不在 `FC_ARTIFACT_PREFIX` 下 | 执行 `deletePrefix()` | 拒绝删除，保护 bucket 其他对象 |
| FC-REG-001 | `fc-function-registry.ts` | 已覆盖 | provider 返回 function missing | 执行 `ensureFunction()` | 创建函数，写入 artifact env 和 runtime env |
| FC-REG-002 | `fc-function-registry.ts` | 已覆盖 | provider 返回 function config 已匹配 | 执行 `ensureFunction()` | no-op，不触发 update |
| FC-REG-003 | `fc-function-registry.ts` | 已覆盖 | image、env 或资源配置 drift | 执行 `ensureFunction()` | 更新函数配置 |
| FC-REG-004 | `fc-function-registry.ts` | 已覆盖 | provider 抛出 SDK 错误 | 执行 `ensureFunction()` | 映射为可读 `FCRuntimeError` |
| FC-INVOKE-001 | `fc-function-invoker.ts` | 已覆盖 | NDJSON frames | 解析 stream、response、error frame | 正确识别帧类型和 payload |
| FC-INVOKE-002 | `fc-function-invoker.ts` | 已覆盖 | buffered frame list | 调用 invoker | stream frame 重放到 `StreamData`，response frame 作为最终返回 |
| FC-INVOKE-003 | `fc-function-invoker.ts` | 已覆盖 | malformed frame | 解析 frame | 返回 protocol error |
| FC-INVOKE-004 | `fc-function-invoker.ts` | 已覆盖 | provider timeout | 调用 invoker | 映射为 invoke timeout |
| FC-MGR-001 | `fc.plugin-runtime.driver.ts` | 已覆盖 | plugin repo 有 active plugin | 执行 `register()` | 依次完成 config、plugin、artifact、function，并写入本地 runtime item |
| FC-MGR-002 | `fc.plugin-runtime.driver.ts` | 已覆盖 | 相同 plugin/version/etag 已注册 | 再次执行 `register()` | 幂等返回，不重复创建函数 |
| FC-MGR-003 | `fc.plugin-runtime.driver.ts` | 已覆盖 | 已注册 runtime item | 执行 `invoke()` | 调用 provider，记录 metrics，返回 handler result |
| FC-MGR-004 | `fc.plugin-runtime.driver.ts` | 已覆盖 | provider 返回 stream frames | 执行 `invoke()` | 正确重放 streaming output |
| FC-MGR-005 | `fc.plugin-runtime.driver.ts` | 已覆盖 | function missing | 执行 `unregister()` | 删除路径容忍 missing，不抛出无意义错误 |
| FC-COMPAT-001 | local-pool 回归 | 已覆盖 | `PLUGIN_RUNTIME_MODE=localPool` | 运行 local-pool driver/service/pod 相关测试 | 现有 local-pool 行为保持兼容 |

## Runtime App 待补测试

| ID | 覆盖对象 | 状态 | 前置条件 | 步骤 | 预期结果 |
| --- | --- | --- | --- | --- | --- |
| FC-RT-001 | `packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC/runtime/src/bootstrap.ts` | 待补 | 缺失或错误签名 | POST `/invoke` | 返回 401/403，不加载 artifact |
| FC-RT-002 | `packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC/runtime/src/plugin-loader.ts` | 待补 | artifact 已下载且 etag 匹配 | 连续执行两次 load | 第二次使用 warm cache |
| FC-RT-003 | `packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC/runtime/src/plugin-loader.ts` | 待补 | artifact etag 变化 | 执行 load | 清理旧缓存并重新下载 |
| FC-RT-004 | `packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC/runtime/src/plugin-loader.ts` | 待补 | artifact export `getToolHandler` | 动态 import 插件 | 正确解析 child handler |
| FC-RT-005 | `packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC/runtime/src/handler.ts` | 待补 | handler 调用 `ctx.streamResponse` | 执行 handler | 先输出 stream frame，再输出 response frame |
| FC-RT-006 | `packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC/runtime/src/handler.ts` | 待补 | handler 正常返回 | 执行 handler | 输出 response frame，包含 invocation id |
| FC-RT-007 | `packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC/runtime/src/handler.ts` | 待补 | handler 抛错 | 执行 handler | 输出 error frame，保留可读错误码和 message |
| FC-RT-008 | `packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC/runtime/src/handler.ts` | 待补 | handler 调用 `ctx.invoke.userInfo()` | 执行 handler | 通过 `InvokeManager` 返回用户信息 |
| FC-RT-009 | `packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC/runtime/src/handler.ts` | 待补 | handler 调用 `ctx.invoke.uploadFile()` | 执行 handler | 通过 `InvokeManager` 上传文件并返回结果 |

建议命令：

```bash
pnpm exec vitest run packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC/runtime
```

## Staging Smoke Test

### 手动发布 runtime image

在 GitHub Actions 中手动运行 `Build and Push FC Runtime Image`，填写 `image_tag`，例如
`2026-08-13-rc1`。workflow 使用以下仓库 secrets 登录阿里云 ACR，并推送：

```text
${FASTGPT_ALI_IMAGE_PREFIX}/fastgpt-plugin-fc-runtime:<image_tag>
```

- `FASTGPT_ALI_IMAGE_PREFIX` 应包含 ACR 命名空间，例如 `registry.cn-hangzhou.aliyuncs.com/fastgpt-finley`。
- `FASTGPT_ALI_IMAGE_USER` 和 `FASTGPT_ALI_IMAGE_PSW` 使用 ACR 访问凭证。
- 当前 runtime 按 `linux/amd64` 构建，和 FC 配置保持一致。
- 推送成功后，将完整镜像地址填入 API server 的 `FC_RUNTIME_IMAGE`。

| ID | 覆盖目标 | 状态 | 步骤 | 预期结果 |
| --- | --- | --- | --- | --- |
| FC-STG-001 | runtime image | 待执行 | 构建并发布 `packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC/runtime/Dockerfile` | ACR 中存在可拉取 image tag |
| FC-STG-002 | OSS artifact | 待执行 | 配置 `FC_ARTIFACT_*`，注册 `getTime` 插件 | FC artifact OSS 中存在 immutable `index.js` |
| FC-STG-003 | function create | 待执行 | `PLUGIN_RUNTIME_MODE=serverless-fc` 启动 API server 后注册插件 | FC 中创建或更新目标函数，函数环境变量包含 `FASTGPT_ARTIFACT_*` 且不包含 `FC_*` 自定义变量 |
| FC-STG-004 | tool invoke | 待执行 | 通过 API 执行 `getTime` | 返回时间结果，API server metrics 记录 FC invoke |
| FC-STG-005 | stream output | 待执行 | 执行带 `ctx.streamResponse` 的官方 JS 插件 | 客户端能收到 stream frame；buffered fallback 有清晰标识 |
| FC-STG-006 | reverse invoke | 待执行 | 执行调用 `ctx.invoke.userInfo()` 和 `ctx.invoke.uploadFile()` 的插件 | FC runtime 能访问 FastGPT invoke API 并得到正确结果 |
| FC-STG-007 | bad signature | 待执行 | 使用错误 signing secret 调用 runtime | runtime 拒绝请求，API server 返回可读错误 |
| FC-STG-008 | missing artifact | 待执行 | 删除测试 artifact 后调用插件 | runtime 返回 artifact missing 错误，日志包含 plugin id/version/etag |
| FC-STG-009 | unregister | 待执行 | 注销插件 runtime | FC function 被删除或标记为可清理，本地 runtime item 移除 |
| FC-STG-010 | local-pool rollback | 待执行 | 切回 `PLUGIN_RUNTIME_MODE=localPool` | API server 使用原 local-pool 路径，插件仍可调用 |

手工 staging 建议顺序：

1. 构建并推送 runtime image。
2. 配置 OSS bucket、RAM role、FC VPC 和 API server secret。
3. 使用 `getTime` 插件注册并确认 FC function/env/artifact。
   API server 的 `FC_ARTIFACT_*` 会映射为函数容器的 `FASTGPT_ARTIFACT_*`；检查配置时不要输出 AK/SK 的值。
4. 执行一次同步 invoke，再执行一次 streaming invoke。
5. 验证 `userInfo` 和 `uploadFile` 反向调用。
6. 故意制造 bad signature、missing artifact、handler throw。
7. 注销插件并检查函数和 artifact 清理边界。

## 验收出口

v0 可进入 staging 的最低标准：

- TypeScript 编译通过。
- FC infrastructure 单测和 local-pool 兼容回归通过。
- `packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC/runtime` runtime app 单测补齐或有手工验证记录覆盖同等路径。
- `getTime` 插件能在真实 FC 环境完成 register、invoke、unregister。
- 至少一个官方 JS 插件在 FC 环境完成 `ctx.streamResponse`、`ctx.invoke.userInfo()`、`ctx.invoke.uploadFile()` 验证。
- 错误路径包括 bad signature、missing artifact、handler throw，均有可读错误和可定位日志。

## 已知风险

- `openapi-buffered` fallback 可以保证结果回放，但真实端到端流式体验需要 HTTP 触发器或自定义域名验证。
- 当前 provider 已能创建/更新 FC function，但 HTTP trigger/custom domain 的生产化配置还需要部署模板补齐。
- `packages/infrastructure/src/plugin/plugin-runtime/drivers/serverless/FC/runtime` 目前缺少进程级自动化测试，staging 前建议优先补。
- artifact 清理策略尚未自动化，避免误删历史可回滚版本。
