# P0

- [x] model, workflow API 接入
- [x] 反向调用获取用户信息
- [x] 反向调用上传文件实现
- [x] 插件无缝更新，rollout 更新，用户不感知更新过程
- [x] 系统工具 pkg
- [ ] WSS 基础的远程调试

# P1

- [ ] 插件 pkg 统一
  - [ ] 模型
  - [ ] workflow pkg
  - [ ] dataset-source pkg
- [ ] Serverless Runtime 支持

# P2

- [ ] 反向调用拓展
  - [ ] 获取团队信息
  - [ ] 调用模型
  - [ ] 调用知识库

### Gateway metrics monitor UI

**What:** 将 Connection Gateway `/metrics` 接入现有 debug runtime monitor。

**Why:** Gateway 会暴露 active connections、sessions、in-flight、mailbox lag、slow consumers、Redis latency；接入 UI 后多节点长连接状态更容易排查。

**Context:** PR1 只需要提供稳定 `/metrics` 和 structured logs。UI 接入可以复用现有 runtime monitor 的 requests、latency、queue、crash 展示模式，避免当前 WSS debug 闭环被前端范围拖大。

**Effort:** M
**Priority:** P2
**Depends on:** Gateway `/metrics` schema 稳定、`apps/debug-runtime-monitor` 数据模型扩展

### Channel WebSocket consumer adapter

**What:** 为 Connection Gateway 增加 channel/WebSocket consumer adapter，用来承载飞书机器人这类渠道长链接。

**Why:** Gateway 已定位为长链接平台能力，plugin debug 只是第一个 consumer；记录渠道 consumer 能防止第一版实现退化成 debug-only。

**Context:** Gateway core 会使用 opaque envelope 和 `ConsumerRegistry`。后续 channel adapter 应作为 consumer 插件接入，复用 session、owner、mailbox、metrics、connection token，不改 Gateway core。

**Effort:** M
**Priority:** P2
**Depends on:** `apps/connection-gateway` PR1、`ConsumerRegistry`、connection token、internal API

# P3

### uploadFile true streaming multipart

**What:** 将 `InvokeManager.uploadFile()` 从 bounded buffer 上传升级为 true streaming multipart upload。

**Why:** 本次计划会通过 `MAX_FILE_SIZE` 和 byte counter 保护内存；true streaming multipart 可以进一步降低大文件上传内存峰值。

**Context:** 现有实现会 `Buffer.concat()`。WSS debug v0 可以先靠 20MB 上限安全运行；后续需要确认 FastGPT upload endpoint、Node fetch/FormData、multipart streaming 的兼容性。

**Effort:** M
**Priority:** P3
**Depends on:** reverse `uploadFile` v0、FastGPT upload endpoint streaming compatibility 调研

### NATS/JetStream mailbox adapter

**What:** 为 Gateway mailbox 增加 NATS/JetStream adapter，实现和 Redis Streams adapter 同一套 `MailboxPort`。

**Why:** Redis Streams 适合 v0；Gateway 未来承载大量渠道长连接时，可能需要更强的消息语义、消费组治理和跨节点 fanout 能力。

**Context:** Consumer 不直接碰 Redis，Redis 是 Gateway 内部实现。抽出 `MailboxPort` 后，后续加 NATS/JetStream 不需要改 plugin-server 或 channel consumer。

**Effort:** M
**Priority:** P3
**Depends on:** Redis Streams adapter 稳定、Gateway mailbox contract tests 成型、生产流量指标
