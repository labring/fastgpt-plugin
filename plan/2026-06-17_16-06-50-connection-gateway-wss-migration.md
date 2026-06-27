<!-- /autoplan restore point: /Users/finleyge/.gstack/projects/FinleyGe-fastgpt-plugin/codex-cli-debug-ux-autoplan-restore-20260617-160650.md -->
---
mode: plan
cwd: /Volumes/Code/fastgpt-plugin
task: Connection Gateway WSS-first redesign
complexity: complex
tool: gstack-autoplan
total_thoughts: 10
created_at: 2026-06-17T16:06:50+08:00
updated_at: 2026-06-17T16:24:00+08:00
base_branch: upstream/dev/tcp-debug
head_commit: 960fe0e
premise_decision: B - development stage allows breaking redesign
---

# Connection Gateway WSS-First Redesign

## 任务概述

本计划重设 Connection Gateway 的外部长连接协议：开发阶段允许破坏性调整，因此直接以 WSS 作为唯一对外长连接协议，移除 TCP-era 的外部连接、`tcpUrl`、Content-Length frame、预创建 gateway session 等兼容包袱。

目标是把 Gateway 收敛成一个 WebSocket-first bidirectional gateway：

- CLI/debug consumer 通过 `wss://.../connection-gateway/v1` 建立长连接。
- Plugin-server/FastGPT 只通过 HTTP internal API 发布 request、查 status、revoke session。
- WSS bind 时由 Gateway 校验 scoped token 并创建/绑定 session。
- Debug source、single-channel multi-plugin、mailbox、owner lease、fail-closed 语义保留。
- Gateway 的抽象面面向未来更多长连接 consumer，例如 Feishu bot WebSocket，但本 PR 只实现 plugin debug 主路径。

## 当前上下文

- 当前分支：`codex/cli-debug-ux`
- 当前提交：`960fe0e feat(debug): reuse debug connect keys`
- base branch：`upstream/dev/tcp-debug`
- merge base：`5bf69ac28bb8409822f2a6cc2d85f5936cc2761f`
- 当前工作区除本 plan 外，还有未跟踪文件 `scripts/fastgpt-official-plugins.zip`，本计划不处理。
- 仓库内未发现 `CLAUDE.md`、`TODOS.md`、`AGENTS.md`。
- UI scope：无，Design review 跳过。

## 已确认 Premises

用户选择 B：当前仍在开发阶段，可以推倒重来，重新设计 gateway。

确认后的设计前提：

1. WSS 是唯一外部 debug 长连接协议。
2. 不保留 TCP 兼容窗口，不设计 `tcpUrl` fallback。
3. Gateway 可以重设 session 创建流程；WSS bind 创建/绑定 session，Plugin-server 不再先调用 `/internal/sessions` 预创建 gateway session。
4. Debug runtime 与生产 runtime 分层保持：debug source 选中后 fail closed，不回退 `localPool` / `serverless`。
5. 一个 debug channel 继续承载多个本地插件；`source` 表示一个 tmbId/debug channel，不按 `pluginId` 拆连接。
6. Gateway 要作为通用长连接服务设计，但本 PR 只落地 plugin debug consumer。

## What Already Exists

| 子问题 | 现有代码 | 处理方式 |
|---|---|---|
| Gateway service/session/mailbox | `packages/infrastructure/src/connection-gateway/service.ts`, `session-registry.ts`, `mailbox.ts` | 保留 Redis mailbox、owner lease、status 查询、request/response stream |
| Transport abstraction | `packages/infrastructure/src/connection-gateway/transports/transport.ts` | 重设为 WSS-oriented connection/message abstraction |
| TCP transport | `tcp-transport.ts`, `tcp-content-length-codec.ts` | 删除或从 runtime wiring 移除；不再作为实现参考目标 |
| WebSocket transport stub | `websocket-transport.ts` | 作为唯一外部 transport 完整实现 |
| Gateway startup | `apps/connection-gateway/main.ts`, `src/deps.ts` | 改成 HTTP server + WSS upgrade 共端口 |
| CLI TCP client | `apps/cli/src/debug/gateway.ts` | 改成 WSS client，删除 `net.Socket`/Content-Length frame |
| FastGPT debug exchange | `apps/server/src/routes/debug-session.route.ts` | 只返回 `wssUrl`/`gatewayUrl`/`connectToken`，不返回 `sessionId`/`tcpUrl` |
| DTO/schema | `packages/interface-adapter/src/contracts/dto/*.ts` | 破坏性更新为 WSS contract |
| Env split | `packages/infrastructure/src/env/index.ts` | 移除 TCP URL/port，新增 public WSS URL/path |

## 推荐方案

选择 WSS-only + bind-created session。

核心变化：connection key exchange 不再创建 Gateway session。它只签发 scoped connect token。CLI 用 token 打开 WSS 并发送 bind frame，Gateway 校验 token 后创建 session，返回 bound frame。之后才进入 request/response envelope 流。

```text
FastGPT ──HTTP──▶ plugin-server ──HTTP internal──▶ connection-gateway
   ▲                                                   │
   │ connection key exchange                          │ request/status/revoke
   │                                                   ▼
debug CLI ───────── WSS bind/envelope/heartbeat ─▶ Gateway owner node
                                                        │
                                                        ▼
                                               Redis session/mailbox
```

### Approach A: WSS-Only With Precreated Gateway Session

Summary: Plugin-server exchange 先创建 session 并返回 `sessionId`，CLI 再用 WSS bind 到该 session。

- Effort: M
- Risk: Med
- Pros: 改动贴近当前 TCP flow。
- Cons: 保留 stale `gatewaySessionId`、transport mismatch、两阶段清理等 TCP-era 复杂度。
- Reuses: 当前 `/internal/sessions` 创建接口。

### Approach B: WSS-Only With Bind-Created Session

Summary: Plugin-server exchange 只签发 connect token；WSS bind 由 Gateway 原子创建/绑定 session。

- Effort: M/L
- Risk: Med
- Pros: session 生命周期由持有长连接的一侧统一管理；状态更少，清理更直接，符合 WebSocket gateway 直觉。
- Cons: 需要重设 WS control frame 和 `ConnectionGatewayService.bind` 入口。
- Reuses: token verifier、session registry、mailbox、metrics、debug source lookup。

### Approach C: Full Generic Gateway Protocol SDK

Summary: 一次性抽象 consumer SDK、server SDK、transport plugin、typed protocol 包，为 debug 和未来 Feishu bot 同时服务。

- Effort: L/XL
- Risk: High
- Pros: 12 个月平台方向最好。
- Cons: 当前 PR 容易变成平台工程，推迟 debug 主路径验证。
- Reuses: 部分 domain/value-object，但需要重写更多边界。

Recommendation: 选择 Approach B。它吃掉当前最明显的设计债，又把 scope 控制在 Gateway + CLI + debug exchange 的真实 blast radius 内。

## 目标 Contract

### FastGPT / Plugin-server Connect Exchange

请求只使用 `connectionKey`：

```json
{
  "connectionKey": "opaque-debug-connection-key"
}
```

响应改为：

```json
{
  "gatewayUrl": "wss://gateway.example.com/connection-gateway/v1",
  "transport": "websocket",
  "source": "debug:tmbId:tmb_xxx",
  "connectToken": "scoped.jwt",
  "expiresAt": 1760000000000
}
```

约束：

- 无 `tcpUrl`。
- 无预创建 `sessionId`。
- `connectToken` scope 包含 `consumerType=plugin-debug`、`subject=tmbId`、`source`、`capabilities=['gateway.bind','invoke']`、`transport='websocket'`、`expiresAt`。
- connectionKey 可重复使用，但一个 `tmbId` 同时只有一个有效 key；新 key 使旧 key/session 失效。

### WSS Message Protocol

WebSocket message 使用 JSON，分 control message 和 envelope message：

```ts
type GatewayWsMessage =
  | {
      protocol: 'connection-gateway.ws.v1';
      type: 'bind';
      requestId: string;
      token: string;
      metadata?: Record<string, unknown>;
    }
  | {
      protocol: 'connection-gateway.ws.v1';
      type: 'bound';
      requestId: string;
      session: ConnectionGatewaySession;
    }
  | {
      protocol: 'connection-gateway.ws.v1';
      type: 'envelope';
      envelope: ConnectionGatewayEnvelope;
    }
  | {
      protocol: 'connection-gateway.ws.v1';
      type: 'heartbeat';
      ts: number;
    }
  | {
      protocol: 'connection-gateway.ws.v1';
      type: 'error';
      requestId?: string;
      code: string;
      message: string;
    };
```

Bind flow：

```text
CLIENT -> bind(token, metadata)
SERVER -> verify token transport=websocket + gateway.bind
SERVER -> create session(status=connected, ownerNodeId=this node)
SERVER -> update metadata
SERVER -> bound(session)
CLIENT -> envelope(ConnectionGatewayEnvelope with session.id/generation)
```

Heartbeat：

- 使用 app-level `heartbeat`，不依赖 WebSocket ping/pong API 是否暴露。
- 双方每 `CONNECTION_GATEWAY_WS_HEARTBEAT_INTERVAL_MS` 发送 heartbeat。
- 超过 `CONNECTION_GATEWAY_WS_IDLE_TIMEOUT_MS` 未收到消息则 close session。

## 实施计划

### 1. Domain / DTO Contract

修改文件：

- `packages/domain/src/value-objects/connection-gateway.vo.ts`
- `packages/interface-adapter/src/contracts/dto/connection-gateway.dto.ts`
- `packages/interface-adapter/src/contracts/dto/plugin-debug-session.dto.ts`
- `packages/interface-adapter/src/contracts/route/connection-gateway.contract.ts`

计划：

- 将 `ConnectionGatewayTransportSchema` 收敛为 `websocket`。
- 新增 `ConnectionGatewayWsMessageSchema`。
- 删除 `ConnectionGatewayCreateSessionRequestDTO` 或改为不对外使用的测试 helper。
- `PluginDebugSessionConnectionKeyExchangeResponseDTO` 改为 `gatewayUrl`, `transport`, `source`, `connectToken`, `expiresAt`。
- 移除 `tcpUrl`、exchange response 顶层 `sessionId`、预创建 session 依赖。

### 2. Gateway Service Redesign

修改文件：

- `packages/infrastructure/src/connection-gateway/service.ts`
- `packages/infrastructure/src/connection-gateway/session-registry.ts`
- `packages/domain/src/ports/connection-gateway/session-registry.port.ts`
- `apps/connection-gateway/src/routes.ts`

计划：

- 新增 `bindConnection(input)`：
  - verify connect token with `expectedTransport='websocket'`
  - assert session budget per subject
  - create session with `status='connected'`
  - apply metadata from bind frame
  - set owner lease
  - expire mailbox
  - return session
- `bindSession(input)` 的 TCP-era 语义删除或替换为 `bindConnection`。
- 删除 internal `POST /internal/sessions` 主路径。
- 保留 internal：
  - `GET /internal/sessions/by-source/:source/status`
  - `POST /internal/sessions/:sessionId/requests:stream`
  - `DELETE /internal/sessions/:sessionId`
  - `GET /metrics`
- 增加 revoke by source 可选接口：`DELETE /internal/sessions/by-source/:source`，用于同一 tmbId 新 key 生效时关闭旧连接。

### 3. WSS Transport / HTTP Server

修改文件：

- `packages/infrastructure/src/connection-gateway/transports/websocket-transport.ts`
- `packages/infrastructure/src/connection-gateway/transports/transport.ts`
- `apps/connection-gateway/main.ts`
- `apps/connection-gateway/src/deps.ts`
- `apps/connection-gateway/package.json`

计划：

- 实现唯一外部 transport：`WebSocketConnectionGatewayTransport`。
- Gateway HTTP server 和 WSS upgrade 共用 `CONNECTION_GATEWAY_PORT`。
- WSS path 默认 `/connection-gateway/v1`。
- 倾向使用成熟 `ws` server 处理 Node HTTP upgrade、message size、close code；CLI 可用 Node 22 global `WebSocket` 或同一依赖，先以实际类型支持为准。
- 删除 TCP listener 启动、日志、shutdown。
- 删除或弃用：
  - `tcp-transport.ts`
  - `tcp-content-length-codec.ts`
  - `CONNECTION_GATEWAY_TCP_PORT`

### 4. CLI WSS Client

修改文件：

- `apps/cli/src/debug/gateway.ts`
- `apps/cli/src/debug/remote-session.ts`
- `apps/cli/src/commands/debug.ts`
- `apps/cli/src/commands/debug.spec.ts`
- `apps/cli/src/debug/gateway.spec.ts`

计划：

- 删除 `net.Socket` 和 Content-Length frame codec。
- exchange response 只解析 `gatewayUrl`/`transport=websocket`。
- 建立 WSS 后先发送 bind message；收到 bound session 后开始处理 envelopes。
- `connectDebugGateway` 返回 bound session。
- reconnect 时复用 connectionKey 重新 exchange/bind；旧 session 由 Gateway close/revoke 清理。
- 多插件仍通过一个 WSS channel 的 bind metadata 发布到 Gateway。

### 5. Server Debug Session

修改文件：

- `apps/server/src/routes/debug-session.route.ts`
- `packages/infrastructure/src/plugin/debug-session.repo.ts`
- `packages/domain/src/value-objects/plugin-debug-session.vo.ts`
- `packages/domain/src/ports/plugin/plugin-debug-session.port.ts`
- `packages/infrastructure/src/plugin/debug-plugin.repo.ts`

计划：

- create debug session 仍生成 `debugSessionId`、`source`、`connectionKey`。
- exchange 只签发 connectToken，不调用 Gateway 创建 session。
- `gatewaySessionId` 从 debug session record 移除，或仅通过 status 查询动态获取。
- revoke 通过 source 找到当前 Gateway session 并 delete/close。
- debug plugin list/status 仍按 source 查询 Gateway status 和 metadata。

### 6. Env / Deployment

修改文件：

- `packages/infrastructure/src/env/index.ts`
- `apps/server/.env.template`
- `apps/connection-gateway/.env.template`
- `apps/connection-gateway/Dockerfile`
- CLI README

计划：

- server env：
  - `CONNECTION_GATEWAY_BASE_URL=http://connection-gateway:3010`
  - `CONNECTION_GATEWAY_PUBLIC_URL=wss://gateway.example.com/connection-gateway/v1`
  - `CONNECTION_GATEWAY_AUTH_TOKEN=...`
- gateway env：
  - `CONNECTION_GATEWAY_PORT=3010`
  - `CONNECTION_GATEWAY_WS_PATH=/connection-gateway/v1`
  - `CONNECTION_GATEWAY_WS_HEARTBEAT_INTERVAL_MS=15000`
  - `CONNECTION_GATEWAY_WS_IDLE_TIMEOUT_MS=45000`
- 删除：
  - `CONNECTION_GATEWAY_TCP_URL`
  - `CONNECTION_GATEWAY_TCP_PORT`
- 部署模型：
  - CLI 只访问公网 WSS URL。
  - plugin-server 只访问内网 HTTP base URL。
  - Gateway HTTP internal routes 仍由 auth token 保护。

## Data Flow

```text
FastGPT create debug session
  -> plugin-server creates source + connectionKey
  -> CLI exchanges connectionKey
  -> plugin-server signs scoped WSS connectToken
  -> CLI opens WSS
  -> CLI sends bind(token, metadata)
  -> Gateway verifies token and creates connected session
  -> Gateway returns bound(session)
  -> plugin-server status/list reads session by source
  -> plugin-server invoke publishes request to session mailbox
  -> Gateway owner node pumps request to CLI over WSS
  -> CLI runs local plugin and sends stream envelopes over WSS
  -> Gateway publishes replies to reply mailbox
  -> plugin-server streams replies to FastGPT
```

Shadow paths：

- connectionKey missing/expired: exchange 404，CLI 直接报错。
- token invalid/expired: WSS bind returns error frame then close。
- WSS connected but no bind: idle/bind timeout close。
- duplicate tmbId key: repo revokes old key，Gateway by source close old session。
- CLI disconnect mid-stream: Gateway close session，plugin runtime fail closed。
- Gateway node crash: owner lease expires，source status returns disconnected，invoke fail closed。

## State Machine

```text
NO_SESSION
  | bind(token valid)
  v
CONNECTED
  | heartbeat/message
  v
CONNECTED
  | revoke / idle timeout / socket close / owner node crash
  v
CLOSED

Invalid transitions:
- NO_SESSION -> REQUEST: rejected, no bound session
- CLOSED -> CONNECTED with same sessionId: rejected, new bind creates new session
- CONNECTED -> CONNECTED by another connection same source: old session closed first
```

## Error & Rescue Registry

| Codepath | What can go wrong | Handling | User sees |
|---|---|---|---|
| WS upgrade | wrong path or missing upgrade | reject upgrade, structured log | CLI connection failed |
| bind parse | malformed JSON | send error if possible, close | CLI bind failed |
| bind token | invalid/expired/transport mismatch | close with auth error, no session created | CLI auth failed |
| bind source | token source conflicts with metadata | reject bind | CLI bind failed |
| session budget | subject exceeds limit | reject bind, metric increment | CLI session limit error |
| heartbeat | idle timeout | close session and connection | CLI reconnecting/error |
| envelope parse | invalid wrapper or envelope | close session, log schema path | CLI disconnected |
| mailbox pump | Redis read/ack error | close connection and session | FastGPT invoke debug unavailable |
| reply stream | timeout waiting for CLI response | registered timeout error | FastGPT tool run failed |
| revoke | source has no live session | idempotent success or 404 by API contract | FastGPT shows disconnected |

## Failure Modes Registry

| Codepath | Failure mode | Rescued? | Test? | User sees? | Logged? |
|---|---|---:|---:|---|---:|
| WSS bind | token expired | Y | unit | CLI auth failed | Y |
| WSS bind | malformed bind JSON | Y | unit | CLI bind failed | Y |
| WSS idle | LB drops quiet connection | Y | unit + smoke | CLI reconnecting | Y |
| source revoke | new key should kill old session | Y | integration | old CLI disconnected | Y |
| mailbox pump | Redis unavailable | Y | unit with fake mailbox | invoke fails closed | Y |
| stream reply | CLI dies mid-run | Y | integration | FastGPT tool error | Y |
| oversized message | metadata/stream too large | Y | unit | CLI disconnected | Y |
| multi-plugin dispatch | unknown pluginId | Y | CLI unit | remote invoke error | Y |

## Test Diagram

```text
CODE PATH COVERAGE PLAN
=======================
[+] domain / dto
    ├── [GAP] Ws bind/bound/envelope/heartbeat/error schemas
    ├── [GAP] exchange response rejects tcpUrl/sessionId-era shape
    └── [GAP] transport enum only accepts websocket

[+] gateway service
    ├── [GAP] bindConnection creates connected session
    ├── [GAP] bind rejects expired token
    ├── [GAP] bind rejects transport mismatch
    ├── [GAP] close by source closes live session
    └── [GAP] publishRequestAndWait still streams replies

[+] websocket transport
    ├── [GAP] upgrade valid path -> connection opened
    ├── [GAP] bind -> bound response
    ├── [GAP] envelope message -> service publish response
    ├── [GAP] heartbeat keeps connection alive
    ├── [GAP] idle timeout closes session
    ├── [GAP] malformed JSON closes connection
    └── [GAP] oversized message closes connection

[+] server debug session
    ├── [GAP] exchange signs WSS token without creating gateway session
    ├── [GAP] revoke closes gateway by source
    └── [GAP] status works before and after WSS bind

[+] CLI gateway
    ├── [GAP] connect exchange -> WSS bind -> bound session
    ├── [GAP] one channel multi-plugin metadata
    ├── [GAP] remote request -> local run -> stream envelopes
    ├── [GAP] reconnect reuses connectionKey
    └── [GAP] auth/upgrade failure shows actionable log

E2E / smoke
===========
[+] Gateway + server + CLI + getTime
    ├── [GAP] run tool through WSS
    ├── [GAP] disconnect CLI then invoke fail closed
    └── [GAP] create new key closes old CLI session
```

Test plan artifact: `~/.gstack/projects/FinleyGe-fastgpt-plugin/finleyge-codex-cli-debug-ux-eng-review-test-plan-20260617-162400.md`

## Performance

- WSS adds upgrade and JSON wrapper overhead, but removes Content-Length frame decoder.
- p99 latency should remain dominated by mailbox block/read, local plugin execution, and FastGPT streaming path.
- Heartbeat interval must be lower than common LB idle timeout; default 15s/45s is a safe starting point.
- Metadata bind may contain many plugin/tool definitions; enforce `CONNECTION_GATEWAY_MAX_ENVELOPE_BYTES` or a dedicated `CONNECTION_GATEWAY_MAX_BIND_BYTES`.
- Metrics must include `transport=websocket` even if transport cardinality is currently one, so dashboards survive future consumer expansion.

## Security

- WSS public endpoint expands attack surface; bind token remains the only authority to create a session.
- Token stays in first bind message, not query string, to avoid proxy logs leaking credentials.
- Internal HTTP routes keep bearer auth and should remain private network only.
- Validate every WS control message with zod before side effects.
- Never log token or raw connectionKey.
- Bind metadata can include plugin descriptions and schemas; treat as untrusted input and enforce size/schema validation.
- Optional Origin allowlist can be added later for browser consumers; CLI-first flow does not rely on browser Origin.

## Observability

Required logs/metrics:

- `connection_gateway.ws_upgrade_total{result}`
- `connection_gateway.ws_bind_total{consumerType,result}`
- `connection_gateway.ws_close_total{reason}`
- `connection_gateway.ws_message_parse_error_total`
- `connection_gateway.ws_idle_timeout_total`
- `connection_gateway.active_connections{consumerType}`
- `connection_gateway.mailbox_lag{consumerType}`
- structured logs include `connectionId`, `sessionId`, `source`, `consumerType`, `remoteAddress`, `closeReason`

## Deployment Sequence

```text
1. Deploy Gateway WSS-only image to test env.
2. Expose gateway HTTP(S) endpoint with WebSocket upgrade enabled.
3. Deploy plugin-server with CONNECTION_GATEWAY_PUBLIC_URL=wss://...
4. Deploy CLI using WSS exchange/bind.
5. Run smoke: create key -> CLI bind -> list debug plugins -> run getTime -> disconnect -> fail closed.
6. Remove TCP Service/Ingress/env from test deployment.
```

Rollback in development:

```text
WSS redesign blocks debug?
  -> revert the WSS redesign PR/commit set
  -> redeploy previous TCP debug branch
  -> keep connectionKey/session repo data disposable in test env
```

## NOT In Scope

- TCP compatibility or `tcpUrl` fallback。
- TUI/daemon UX 优化。
- FastGPT 侧 UI/产品入口。
- Feishu bot consumer adapter。
- 替换 Redis mailbox/broker。
- 生产级多租户 Origin/CORS 策略；当前保留 token-first auth，后续面向浏览器 consumer 时再收敛。

## CEO Review

### 0A Premise Challenge

用户已经明确当前是开发阶段，可以破坏性重设 gateway。继续保留 TCP fallback 会把已经确认过时的设计债带入下一轮实现。当前最直接的产品结果是：开发者只拿一个 WSS connect link，公网部署只暴露标准 HTTPS/WSS 入口，调试路径继续 fail closed。

### 0B Existing Code Leverage

保留 session registry、mailbox、request streaming、source lookup 和 debug runtime driver 的核心数据流。重写范围集中在长连接入口、bind/session lifecycle、CLI client 和 exchange DTO。计划没有重建 plugin runtime 或 broker。

### 0C Dream State

```text
CURRENT
  TCP debug can run, but protocol and session lifecycle are still TCP-shaped
    ->
THIS PLAN
  WSS bind owns session lifecycle, Gateway exposes one standard long-connection endpoint
    ->
12-MONTH IDEAL
  Connection Gateway becomes a typed bidirectional connection layer for debug,
  bot channels, and future long-lived consumers, with clear control frames,
  source-scoped routing, and first-class observability
```

### 0C-bis Implementation Alternatives

Approach B is selected. Approach A keeps too much TCP-era state; Approach C is larger than this PR's value surface.

### 0D Mode

Mode: SELECTIVE EXPANSION。用户打开了重设 gateway 的 scope，但当前最该 boiling 的 lake 是 WSS-only debug 主路径、heartbeat、tests、env/deploy docs。通用 SDK 和 Feishu adapter 进入后续设计。

### 0E Temporal Interrogation

- Hour 1: 定义 WS control frame schema 和 service bind API。
- Hour 2-3: 实现 HTTP server upgrade + WSS transport。
- Hour 4-5: 改 CLI bind flow 和 server exchange DTO。
- Hour 6+: 补满 service/transport/CLI/server tests，跑 test/build，做远程 WSS smoke。

### CEO Dual Voices

Outside voices not run: current tool policy does not allow spawning subagents without explicit delegation request, and network-backed Codex voice is unavailable. Primary review found one strategic risk: gateway redesign要聚焦 WSS session lifecycle，避免顺手做完整 consumer SDK。

### CEO Completion Summary

| Section | Result |
|---|---|
| Premises | Confirmed with breaking redesign |
| Mode | SELECTIVE_EXPANSION |
| Scope proposals | WSS-only, bind-created session, heartbeat, full test matrix |
| Accepted | all are in blast radius |
| Deferred | generic SDK, Feishu adapter, TUI/daemon |
| Critical gaps | 0 if bind/heartbeat/test requirements remain in scope |

## Eng Review

### Step 0 Scope Challenge

文件数会超过 8 个，因为这是协议边界重设，涉及 domain schema、gateway service、transport、CLI、server route、env 和测试。复杂度可接受，关键约束是删除 TCP branch，减少长期分支状态。

### Architecture Diagram

```text
apps/server debug-session.route
  └─ exchange connectionKey -> WSS connectToken

apps/cli debug gateway
  └─ WSS bind(token, metadata)
       │
       ▼
apps/connection-gateway main/http server
  ├─ Hono internal HTTP routes
  └─ WebSocket upgrade /connection-gateway/v1
       │
       ▼
ConnectionGatewayService.bindConnection
  ├─ HmacConnectionGatewayToken.verify
  ├─ RedisConnectionGatewaySessionRegistry.create/update
  ├─ RedisConnectionGatewayMailbox read/publish/ack
  └─ InMemoryConnectionGatewayMetrics
```

### Code Quality Findings

1. Remove `net.Socket` assumptions from CLI and transport abstractions in one pass.
2. Keep WS protocol wrapper explicit; avoid overloading raw `ConnectionGatewayEnvelope` for bind/heartbeat/error.
3. Delete TCP codec tests with the TCP codec; add WSS protocol tests at the same layer.
4. Keep `ConnectionGatewayService` as the lifecycle owner; transport should parse/control IO and delegate state changes.

### Test Review

The test diagram above is mandatory implementation input. Regression tests should specifically prove:

- exchange no longer returns `tcpUrl` or precreated `sessionId`
- bind creates session only after token verification
- status by source works after WSS bind
- old session is closed when a new key/source session takes over
- CLI remains one WSS channel for multiple plugins

### Performance Review

No DB N+1 risk. Redis pressure remains similar to TCP design. Additional WSS timers must be cleared on close to avoid leaking intervals in long-running CLI/gateway tests.

### Security Review

Highest risk is public WSS bind accepting oversized or malformed metadata before auth/session checks. Implementation order must parse size-limited frame, validate control schema, verify token, then write session.

### Deployment Review

The deployment simplifies to one exposed HTTP(S) service. Test env must ensure WebSocket upgrade headers pass through Ingress/Sealos. Smoke should exercise real public WSS URL, not only localhost.

### Eng Completion Summary

| Section | Result |
|---|---|
| Architecture | Sound with bind-created session |
| Code quality | 4 constraints |
| Tests | 25 planned paths |
| Performance | heartbeat timers and message size are main risks |
| Security | token-in-bind, schema validation, size limit required |
| Deployment | one HTTP(S) entry, real WSS smoke required |
| Critical gaps | 0 if test matrix is implemented |

## Decision Audit Trail

| # | Phase | Decision | Principle | Rationale | Rejected |
|---|---|---|---|---|---|
| 1 | Intake | Use `upstream/dev/tcp-debug` as base | Pragmatic | Fork point exists locally at `5bf69ac` | default `main` |
| 2 | Premise | Accept breaking redesign | Bias toward action | User confirmed current feature is still development-stage | compatibility window |
| 3 | CEO | Select WSS-only bind-created session | Explicit over clever | Session lifecycle belongs to the WSS owner connection | precreated gateway session |
| 4 | Eng | Remove TCP external protocol | DRY | One external transport keeps tests and env simpler | tcp fallback |
| 5 | Eng | Keep heartbeat in scope | Completeness | LB idle timeout is expected WSS failure mode | defer heartbeat |
| 6 | Eng | Skip UI/design phase | Explicit over clever | No screen/component/layout changes in this repo | run design review |

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | clear | Breaking redesign accepted; WSS-only bind-created session selected |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | unavailable | External voice unavailable in current tool policy/network |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | clear | 25 planned test paths, 0 critical gaps if implemented |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | skipped | No UI scope |

**UNRESOLVED:** none.
**VERDICT:** CEO + ENG CLEARED — ready to implement WSS-first redesign.
