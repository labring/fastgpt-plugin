# Worker 内部反向调用网关

## 部署边界

网关运行在 **FastGPT Plugin 服务**，复用 `InvokeManager` 调用固定的 FastGPT API；不是 coworkerd 管理 API，也不接受插件提供的目标 URL。

启用配置：

- `INTERNAL_PLUGIN_INVOKE_GATEWAY_URL`：Worker 可访问的完整基址，例如 `https://plugin.internal/internal/plugin-invoke/v1`。构建 Worker 时的 `invokeGatewayUrl` 必须指向同一个网关。
- `INTERNAL_PLUGIN_INVOKE_SECRET`：独立的至少 32 字符随机密钥，仅通过服务端环境/Secret 管理注入；不要提交到仓库、写入 bundle 或传给 Worker。多服务副本必须使用同一个密钥，切换密钥会使旧令牌立即失效。不要复用 coworkerd 管理 Token、`AUTH_TOKEN` 或 `JWT_SECRET`。
- `INTERNAL_PLUGIN_INVOKE_TOKEN_TTL_MS`：默认 30000，允许 1–30000 ms；无自动续期。超过 TTL 的执行不能继续反向调用，不会自动重试插件执行。
- 上传上限复用 `MAX_FILE_SIZE`（字节）。在读取原始字节流时累计检查，不能依赖 `Content-Length`。

未配置网关 URL 时不挂载路由，也不提供签发回调。配置 URL 却缺少密钥会拒绝启动。

内部路由为 `/internal/plugin-invoke/v1/*`，独立于 `/api/*` 的管理鉴权。没有公开签发接口，管理 Token 也不能代替短效令牌。生产部署应使用 HTTPS/可信 TLS 终结，限制该路由的网络可达性，配置 coworkerd Egress 白名单，并在边缘代理设置请求大小、连接数和速率限制。不要记录 Authorization、`x-fastgpt-invoke-token` 或上传正文。

## 凭据与调用约定

宿主为每次工具调用创建独立 invocation ID，并提供 **仅宿主可用** 的 `options.internalInvoke.issueToken(tenantId)`。远程驱动在解析真实部署 tenant 后、发出 Ingress 请求前调用它。不得从插件 `source` 或客户端传来的请求头推导签发 tenant，不得序列化整个 options 或保存业务凭据到控制面。

Coworkerd 驱动在 T6 接入该回调。现有 LocalPool 保留原有 `InvokePort`，不会调用此签发器；Debug 调用不附加该回调。T6 在 coworkerd 0.5.2 的真实 JSON/NDJSON 执行已通过，但 Worker 到宿主 HTTP 网关请求被集群 Egress 的 `private-network` 规则拒绝，尚未完成真实反向调用。需要集群管理员在 `egress.tenants` 对该 Worker 所属 tenant 放行精确宿主网关主机名/端口；不要放行整个私网或管理面地址。策略更新后应重跑临时 tenant smoke，并确认网关收到请求。

令牌使用带版本/用途隔离的 AES-256-GCM 认证加密，绑定 tenant、plugin、invocation、签发时间、过期时间和固定能力白名单。与可直接解码的签名 JWT 不同，Worker 无法从令牌读取原始 FastGPT `invokeToken`。Coworkerd Ingress 发出请求前还会将 `payload.systemVar.invokeToken` 清空，避免经 SDK 上下文泄露原始凭据；其他 system variables、业务 secrets 仍按单次调用传递。

Worker 请求头：

- `x-fastgpt-invoke-token`：短效令牌。
- `x-fastgpt-invocation-id`：对应 invocation ID。

Shim 为每个请求建立独立 `HttpInvokeClient`，从 Ingress 请求路径 `/<tenant>/<plugin>/run` 读取 tenant/plugin，向网关传递：

- `Authorization: Bearer <short-lived-token>`。
- `x-fastgpt-tenant-id`、`x-fastgpt-plugin-id`、`x-fastgpt-invocation-id`，三者必填且必须匹配认证后的 claims。

允许的 POST 端点仅有：

| 路径（相对于网关基址） | 宿主能力 | 请求体 |
| --- | --- | --- |
| `/userInfo` | `InvokePort.userInfo()` | 空 JSON 对象 |
| `/wecomCorpToken` | `InvokePort.getWecomCorpToken()` | 空 JSON 对象 |
| `/uploadFile` | `InvokePort.uploadFile()` | 原始文件字节；可选 URI 编码的 `x-fastgpt-file-name` 与支持的 `Content-Type` |

成功返回 JSON Result tuple `[data, null]`，响应标记 `Cache-Control: no-store`。凭据无效/过期/缺少上下文返回 401；能力或身份范围不匹配返回 403；文件过大返回 413；输入不合法返回 400；上游失败返回不含敏感细节的 502。上传读流和上游 fetch 同时受请求取消和令牌过期约束。

这是 **短效、可多次使用的 bearer capability**：同一次插件执行可能先查用户再上传文件，因此不是一次性 token。持有令牌者在有效期内可以重放其已授权能力；identity headers 只做一致性校验，不是独立身份凭证。当前无跨副本的“调用结束即撤销”注册表；Shim 会在调用结束/取消时中止其客户端，但恶意插件保留的令牌在 TTL 内仍然有效。不能把它描述成服务端即时撤销或完整防重放机制。

## 验证范围

`apps/server/src/routes/internal-invoke.route.test.ts` 包含本机真实 TCP HTTP 联调：Worker Shim → 网关 → 模拟 FastGPT API，覆盖并发身份隔离、用户信息、企业微信 Token、文件上传。另有令牌篡改/过期/范围校验、上传字节限额与读流超时、错误脱敏和日志正文省略测试。

T6 真实集群 smoke 使用临时 tenant 验证自动 bundle、Trial Load/activate、revision propagation、JSON / NDJSON invoke、Worker/version 删除及 tenant cleanup。反向调用请求到达 Worker，但 coworkerd 节点以 `EGRESS_DENIED: private-network` 拒绝，宿主网关未收到 HTTP 请求；允许的出站地址及 TLS/端口仍待运维配置并重测。该 smoke 使用本地模拟 `InvokeManager`，不等同于生产 FastGPT API 联调。
