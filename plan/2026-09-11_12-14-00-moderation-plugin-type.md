---
mode: plan
cwd: /Volumes/Code/worktrees/fastgpt-plugin/cozy-pine/fastgpt-plugin
task: Moderation plugin type (content review compat layer)
complexity: complex
tool: plan
created_at: 2026-09-11T12:14:00+08:00
updated_at: 2026-09-17
---

# 新增插件类型：`moderation`（内容审查）

> 本文件是该插件类型的**设计记录**：只描述已落地的契约、边界与不变量。逐步实施清单由代码与
> git 历史承载，不在本文件重复。
>
> 框架只交付插件类型本身。百度 / 阿里云等 provider 插件包另开计划，在
> `fastgpt-official-plugins` 仓库使用本仓库的 CLI 模板创建。

## 终态概览

`moderation` 是本仓库的第二种可运行插件类型。plugin 侧提供不同内容审查服务的兼容层，
对外暴露一套标准结构供 FastGPT 调用。

- `.pkg` 插件可声明 `type: 'moderation'`，manifest 携带 provider 与支持模态的元信息
  （`meta.provider` / `meta.modalities` / `meta.docUrl`），走与 `tool` 完全相同的安装、
  版本管理与进程池运行链路；区别是调用的事件是 `check` 而不是 `run`。
- SDK factory 提供 `defineModeration()`：插件作者只写「调某个 provider 的 HTTP 接口 +
  映射结果」这一件事，标准结构由 SDK 强制校验，provider 差异隔离在适配器内部。
- FastGPT 通过两个接口调用：`GET /moderation`（插件详情）与 `POST /moderation/check`（内容审查）。
- 审查结果归一为 `pass | block | suspected | error` 四档裁决 + 逐项命中（归一化标签、
  provider 原生标签、provider 原生置信度、命中词）；是否放行由 FastGPT 决策，本层不实现决策。
- 本版本只服务 `modality: 'text'`；严格度由 provider 自己的配置项表达，框架不做归一化。

## 标准结构设计依据

### 裁决档位

归一化为四档：`pass` / `block` / `suspected` / `error`。

| 档位 | 含义 | 谁决定处理方式 |
| --- | --- | --- |
| `pass` | provider 判定合规 | FastGPT |
| `block` | provider 判定违规 | FastGPT |
| `suspected` | provider 给出命中，但置信度不足以直接判违规（腾讯 `Review`、百度「疑似」、易盾 `action=2`） | FastGPT |
| `error` | provider **没能给出判定**（HTTP 错误、超时、未知标签、百度 `conclusionType=4`） | FastGPT |

`suspected` 与 `error` 必须分开：前者是 provider 给出的**判定**，后者是 provider **没能给出判定**。
两者在 FastGPT 侧的处理策略通常完全不同（疑似 → 人工 / 降级放行；错误 → 重试 / 兜底），
合并成一档就丢掉了这个区别。

各家 provider 的映射：

| provider | 原生裁决字段 | 取值 → 标准档位 |
| --- | --- | --- |
| 腾讯云天御 TMS | `Suggestion` | `Pass` → `pass`；`Review` → `suspected`；`Block` → `block` |
| OpenAI Moderation | `flagged` | `false` → `pass`；`true` → `block`（无 `suspected`） |
| 百度内容审核 | `conclusionType` | 1 → `pass`；2 → `block`；3 → `suspected`；4 → `error` |
| 阿里云内容安全 | `RiskLevel` | `none`、`low` → `pass`；`medium` → `suspected`；`high` → `block`（适配器直接映射档位；同一响应里的 `Confidence` 是逐标签置信度，落进 `hit.score`） |
| 网易易盾 | `action` | `0` → `pass`；`1` → `block`；`2` → `suspected` |

**是否放行由 FastGPT 决定**：本层只输出上述四档与归一化标签，不实现「疑似怎么办」「错误怎么办」。
FastGPT 的默认策略既不在本层实现，也不在本层假设。

四档之外不引入第五档，框架也不做阈值调档：`verdict` 由 provider 的原生判定映射而来，本层不改写。
逐标签置信度（`hit.score`）只作为明细下发、不参与任何框架级判定——置信度是逐标签的，跨标签取
最大值与统一的严重度刻度都不成立。

### 标签归一化

取各家并集后归一化，**同时把 provider 原生标签原文保留在 `providerLabel`**，
因此归一化不丢信息。

| 归一化标签 | 腾讯 TMS `Label` | 百度 `type` | 阿里云 `labels` | 易盾 `label` | OpenAI `categories` |
| --- | --- | --- | --- | --- | --- |
| `porn` | Porn | 色情 | porn | 100 | sexual |
| `politics` | Polity | 涉政 | politics | 500 | — |
| `terror` | Terror | 暴恐 | terrorism | 300 | — |
| `contraband` | Illegal | 违禁 | contraband | 400 | illicit |
| `abuse` | Abuse | 谩骂 | abuse | 600 | harassment |
| `hate` | — | — | — | — | hate |
| `ad` | Ad | 广告 | ad | 200 | — |
| `advertising-law` | — | 广告法 | — | — | — |
| `privacy` | — | 隐私 | — | — | — |
| `flood` | — | 灌水 | flooding | 700 | — |
| `self-harm` | — | — | — | — | self-harm |
| `violence` | — | — | — | — | violence |
| `sexual-minors` | — | — | — | — | sexual/minors |
| `other` | Teenager / Value / 自定义 | 低俗 / 其他 | customized | 800 | — |

### 命中明细与置信度

一次审查产出的是「一条总体裁决 + 一组逐项命中」，两者职责严格分开：

- **`result.verdict`（顶层）是唯一的权威裁决**，由 provider 原生判定按上表映射得到。
- **`hits[]` 是逐项明细**，供业务层定位、展示与人工复核。每项携带归一化标签 `label`、provider
  原生标签 `providerLabel`、可选 `subLabel`、provider 原生置信度 `score` 与该标签命中的
  `keywords`。归一化会让「Porn / 色情 / 100 / sexual」都变成 `porn`，排障时必须回看原文，
  因此每项都带 `providerLabel`。
- **`hits[].score` 是 provider 原生置信度**（腾讯 `Score`、阿里云 `Confidence`、OpenAI
  `category_scores`），只填 provider 真实给出的数值；**禁止把枚举或布尔**（`conclusionType`、
  `action`、`flagged`）编成数字，那会伪造一个 provider 并未给出的刻度。provider 无置信度时省略该字段。
- **不做逐项档位**：阿里云等 provider 没有逐项档位信号（`RiskLevel` 是整条文本的，且由厂商控制台
  的可配置分值算出），逐项 `verdict` 只能靠适配器编造。
- **不做聚合字段**：`result` 上不放 `label` / `score`。置信度逐标签而不可比，跨标签取最大没有语义
  （`porn:60` + `ad:90` 选出 90 是错的），聚合还会与 `hits[]` 构成两个来源。`result.keywords`
  （全部命中词并集）是唯一保留的聚合值，由 SDK 从 `hits[].keywords` 派生后覆盖填写。
- 只有一个总体分数、没有分项标签的 provider：落成单个 hit（`label: 'other'`、`providerLabel`
  填原生字段名、`score` 填该数值）。

### 模态：本版本只服务文本

`ModerationModalitySchema` 取 `text | image | audio | video`，四个值作为**契约扩展点**保留；
本版本框架只服务 `text`：

- 唯一的支持集声明在 `packages/domain/src/value-objects/moderation.vo.ts` 的
  `SUPPORTED_MODERATION_MODALITIES = ['text']`，宿主与插件共用这一个来源。
- `modality !== 'text'` 的请求**框架级失败**（`ErrorCode.moderationModalityNotSupported`，
  字符串码 `plugin.moderation.modality_not_supported`，HTTP 400），而不是静默交给 provider、
  也不是降级为 `error` 档结果。理由：这是本版本的实现范围，不是 provider 能力，也不是
  provider 判定失败。
- 宿主（`ModerationManager.check`，在解析插件**之前**）与插件（`ModerationFactory`）两处都拦。
- 宿主另做一层 **provider 能力交叉校验**：`input.modality` 必须出现在 `plugin.meta.modalities` 里，
  否则以同一个错误码失败（`data` 中区分 `frameworkSupported` 与 `pluginSupported`）。
  两类拒绝共用错误码，因为调用方的动作相同（换模态或换插件）。

**异步形状（`pending` 提交 + `query` 轮询）本版本不交付**：音频 / 视频在腾讯 IMS/AMS、阿里云、
百度均为异步提交 + 轮询，本版本既然只服务文本，`pending` 就没有生产者。check 的返回信封
`{ status: 'done', result }` 已预留稳定分支位：将来接入异步 provider 时，`status` 增加
`'pending'` 取值并新增 `query` 事件与任务查询接口，属纯增量。

### 流式审查

结论：**本次不引入流式事件**。流式审查由调用方编排 + 现有 `check` 表达，契约只加一个可选的
`partial` 标记。

理由：

- **结果侧不需要流式**。审查结果是单值，没有中间态值得推送。协议里已有 `stream` 帧，但它的
  payload 是 `{ type: 'answer' | 'fastAnswer', content: string }`（承载面向模型的可见文本），
  要承载结构化的增量裁决就必须扩展**共享流帧 union**，会波及 tool 通道、`sdk/client`、CLI debug
  的全部消费方——这是协议变更，不该夹带在本次改动里。
- **输入侧的「边生成边审」用重复 `check` 表达即可**。调用方（FastGPT）按窗口累积文本，多次调用
  `check`，每次传累积后的 `content` 并复用同一个 `sessionId`。`sessionId` 已存在，腾讯
  `SessionId` / 阿里云 `AssociateId` 的语义正是「同一会话内相似内容去重」，天然消解重复提交。
  transport 侧零改动。
- **真正的增量 API 不存在**。五家 provider 的文本审核都是全量提交接口，没有增量接口。插件侧
  无法把全量接口变成增量，硬做只会在沙箱里模拟「累积 + 重复调用」，把复杂度搬进进程池却
  换不到能力。
- **实时音视频流**（腾讯 IMS/AMS、阿里云 live stream）是「提交一次 + 回调推送结果」模型，
  与 request/response 通道根本不同，见「另开计划的范围」。

为使调用方编排**正确**（而不只是可行），契约加一个可选字段：

- `ModerationCheckInputSchema.partial?: boolean`，默认 `false`（缺省即一次性全量）。置 `true`
  表示 `content` 后续还会增长。provider 可据此跳过必然被推翻的判定、或延迟上报「可能只是关键词
  前缀」的命中。框架不解释该字段，只透传。

将来若出现真正的增量接口、或需要在单次会话内做早期中断，再引入 `checkStream` 事件——transport
已支持 request 输入流（`request.waitForInputStream()`，见
`packages/infrastructure/src/plugin/plugin-runtime/ports/channel/README.md`「Request 输入流」），
但需要扩展共享流帧 union，因此单独成计划。

### 配置面：secrets 与严格度

插件配置只有一处：插件声明的 `secretSchema` → 调用时的 `ctx.secrets`。

**`secretSchema` 是扁平的一层**，用户填什么，`ctx.secrets` 就是什么：

```ts
const secretSchema = z.object({
  accessKeyId: z.string().meta({ title: 'AccessKey ID', isSecret: true }),
  accessKeySecret: z.string().meta({ title: 'AccessKey Secret', isSecret: true }),
  // 厂商控制台里配好的策略 ID：严格度由 provider 自己控制
  strategyId: z.string().optional().meta({ title: 'Strategy ID', isSecret: false })
});
```

- **声明了才校验**：声明了 `secretSchema` 就 `safeParse(payload.secrets)`，失败输出 `error` 帧
  （框架级失败，`data` 带 zod issues）；**未声明时原样透传，不解析也不 strip**——否则若照抄
  tool 的 `secretSchema ?? z.object()`，`z.object({})` 会把整份配置 strip 成空对象。
- 厂商侧配置都放这里：接入凭据、接入点，以及厂商策略 ID（腾讯 `BizType`、百度 `strategyId`、
  易盾 `businessId`）。每个插件声明自己的 schema，插件之间没有共享命名空间，因此不需要分组信封。

**严格度不做框架归一化**。四家 provider 的严格度载体不是同一类东西——腾讯是策略 ID、百度是
可逐子标签调松紧的策略 ID、易盾是业务场景 ID、阿里云是控制台里的风险分值——没有共同刻度可以归一。
因此：

- 本仓库**不提供**审查级别（`reviewLevel`）枚举、阈值预设、`applyModerationPolicy`，也没有策略
  持久化与 `/moderation/policy/*` 接口。
- 要调严格度就在厂商控制台配好策略，把策略 ID 作为 `secretSchema` 的一个配置项透传过去。
- 原因不止「无法归一」：厂商的 `Suggestion` / `RiskLevel` 已经是「置信度 × 标签严重度 × 厂商自己的
  阈值」三合一之后的成品，框架即使拿到一个等级，也只能事后按分数改写档位——最好情况是重复厂商
  判定，最坏情况是用一条与标签无关、未校准的全局线推翻它。

### 强制不变量

1. **provider 无法判定 → `error` 档，不是 `pass`，也不是失败**。HTTP 错误、超时、未知标签、
   百度 `conclusionType=4` 等，统一归一为
   `{ status: 'done', result: { verdict: 'error', errorMessage } }` 作为**正常结果**返回，
   让 FastGPT 拿到统一结构自行决策。本层绝不把「没能判定」伪装成「判定为合规」。
2. **框架级失败 ≠ `error` 档**。插件不存在、类型不匹配、插件进程崩溃、返回值不合 schema——
   这些是 `failureResult`（`ErrorCode.pluginInvokeFailed` / `pluginRuntimePluginNotFound`），
   不产生 `error` 档结果。分界线：`error` 档 = 「插件正常工作，但 provider 没能给出判定」。
   适配器必须自己 `catch` provider 调用异常并返回 `ctx.moderationError(...)`：未捕获异常会被当作
   框架级失败，编码 bug 与「provider 暂时不可用」在运维上要能区分。
3. **标准结构硬校验**，不是文档约定：`ModerationFactory`（插件侧）与 `consumePluginResult`
   （宿主侧）分别在边界 `parse` / `safeParse`，不合规结构得到明确报错而非静默放行；插件发出的
   `stream` 帧也被显式拒绝（该事件不支持流式输出），不能忽略后落到「插件没有返回结果」这种
   误导性诊断。
4. **声明字段必须被校验，否则不加**。`meta` 只放 `provider`（框架权威填充 `result.provider`）、
   `modalities`（宿主与插件交叉校验）、`docUrl`（展示）。`scenes` / `supportsSession` /
   `reviewLevels` 这类没有消费者的声明字段不加——声明了却不校验，调用方会把它当成已被强制。

## 关键文件

- `packages/domain/src/value-objects/moderation.vo.ts`——标准契约的唯一真相来源：四档裁决、标签
  枚举、hit / result / check 信封、`SUPPORTED_MODERATION_MODALITIES`、`ModerationCheckPayloadSchema`。
  **不含任何派生或阈值函数**。
- `packages/domain/src/entities/plugin.entity.ts`——`PluginSchema` 是 discriminatedUnion，新增插件
  类型必须同时加成员与 `z.literal` 判别符；`RunnablePluginTypes` / `isRunnablePluginType` 是可运行
  类型判定的唯一来源（此前 6 处硬编码 `'tool'`，含 `plugin-delete.uc.ts` 那处会漏 unregister 的）。
- `packages/domain/src/ports/plugin/plugin-runtime-manager.port.ts`——`PluginTypeEventNames` 与
  `isPluginEventSupported` / `isKnownPluginEvent` 是事件门禁的唯一来源，local-pool 驱动与
  debug 通道都收敛到这里。
- `sdk/factory/src/moderation-factory.ts`——兼容层核心；`ModerationCheckResultSchema.parse(...)`
  是标准结构的强制校验点（`provider` 与 `keywords` 在 parse **之前**由框架权威填充）；
  「是否声明过 `secretSchema`」是独立状态，决定 secrets 是校验还是原样透传。
- `packages/infrastructure/src/plugin/moderation.impl.ts`——插件解析、两处模态门禁、invoke，以及
  `consumePluginResult` 的调用方。
- `packages/infrastructure/src/plugin/utils/consume-plugin-result.ts`——把插件输出流抽干成单值并做
  结构校验；`stream` 帧、`error` 帧、缺失 `response` 帧、结构不合规都映射为明确的失败。
- `apps/cli/templates/moderation/`——`create --type moderation` 生成的模板：可运行的关键词 provider
  （不触网），演示 `hits` 与扁平 secrets。

## 验证

以下为本类型落地时实际执行并通过的验证。

前置：`pnpm install && pnpm build:sdk-factory && pnpm build:cli`。

1. **契约与边界**（`pnpm test`）：
   - `sdk/factory/src/moderation-factory.test.ts`：`provider` 与 `keywords` 由 factory 填充后通过
     `ModerationCheckResultSchema` 校验；provider 返回缺 `verdict` 的对象 → `error` 帧；provider
     抛异常 → `error` 帧（**不是** `error` 档结果）；声明 `secretSchema` 才校验、未声明时 secrets
     原样透传（不被 strip）；`modality: 'audio'` → `error` 帧且适配器**一次都没被调用**；
     `modalities: ['image']` 的 provider 收到 `text` → `error` 帧；`modalities: []` → 构造期抛错；
     `ctx.moderationError` → 合法的 `error` 档结果。
   - `packages/infrastructure/src/plugin/moderation.impl.test.ts`：`response` 帧 → `done` 结果；
     `stream` 帧 → 失败且 reason 指出不支持流式输出；`error` 帧 → 失败且带上游文本；缺 `result`
     → 失败且 reason 为「插件返回结构不符合标准结构」；非文本模态 → 失败且 `invoke` 与
     `getPluginByUserPluginId` **都未被调用**（守卫在解析插件之前）；`meta.modalities=['image']`
     + `text` → 失败且 `data.pluginSupported=['image']`；`type: 'tool'` 的插件 → 失败。
   - `apps/server/src/routes/moderation.route.test.ts`：成功 200 且返回 `{ data }`；失败 400 且带
     `error.code`；`modality: 'audio'` → 400 且 `error.code` 为
     `plugin.moderation.modality_not_supported`；详情失败 404。
   - `apps/server/src/routes/plugin.route.test.ts`：`GET /plugins?types=moderation` → 200 且向 repo
     透传 `types: ['moderation']`（DTO 枚举未放开时这条会是 400）。
   - `packages/infrastructure/src/plugin/utils/pkg-parser.test.ts`：moderation `.pkg` 的 `type`
     分发正确、`meta` 完整、`logo.svg` 与 `README.md` 解析为访问 URL。
   - `packages/infrastructure/src/plugin/codec/moderation.codec.test.ts`：`refreshConfirmedAssets`
     替换 icon 与 readme、并透传解析失败。
   - `apps/cli/src/commands/create.spec.ts`：`--type moderation` 生成 `index.ts`（默认导出
     `defineModeration(...)`）并删除候选入口，`debug:run` 脚本带 moderation 样例输入。

2. **全绿**：根目录 `pnpm typecheck && pnpm test` → 51 个文件 / 381 个用例通过；
   `apps/cli` 下 `pnpm vitest run` → 8 个文件 / 46 个用例通过。

3. **CLI 端到端冒烟**（一次性，验证后删除临时工程）。`--type moderation` 生成的项目依赖 workspace
   内的 sdk-factory，因此软链而非从 npm 安装：

   ```bash
   pnpm build:cli
   node apps/cli/dist/index.js create ./tmp-moderation-smoke --type moderation --description "Smoke moderation"
   mkdir -p tmp-moderation-smoke/node_modules/@fastgpt-plugin
   ln -sfn ../../../sdk/factory tmp-moderation-smoke/node_modules/@fastgpt-plugin/sdk-factory
   (cd tmp-moderation-smoke && node ../node_modules/vitest/vitest.mjs run)   # 模板自带 4 个用例通过
   ```

   随后在 `tmp-moderation-smoke` 内执行 `node ../apps/cli/dist/index.js build --minify`、
   `check --entry . --output ./dist`、`pack`，全部通过；`dist/manifest.json` 打印
   `moderation keyword ["text"]`，`secretSchema.properties` 为
   `['blockedKeywords','suspiciousKeywords']`。

4. **真实子进程端到端**（一次性脚本，`pnpm tsx` 运行，验证后删除）：把 `.pkg` 的 `dist/` 与一份
   `sdk-factory` + `zod` 放进 `LOCAL_FILE_BASE_PATH` 下的运行时目录（pod 的 `--allow-fs-read`
   只放行该目录与插件目录），用 `parsePkg` 解析、真实 `LocalPoolPluginRuntimeManager` fork 子进程
   注册，再用 `ModerationManager` 调用。实测输出：

   - `content: 'hello world'` + `secrets: { blockedKeywords: 'xyz' }` →
     `{"status":"done","result":{"verdict":"pass","keywords":[],"hits":[],"provider":"keyword"}}`
   - `content: 'this has BADWORD inside'` + `secrets: { blockedKeywords: 'badword' }` →
     `verdict: "block"`、`keywords: ["badword"]`、`hits[0].keywords: ["badword"]`
     （**扁平 secrets 穿过真实进程边界**）
   - `content: 'this is meh content'` + `secrets: { suspiciousKeywords: 'meh' }` →
     `verdict: "suspected"`、`keywords: ["meh"]`
   - `modality: 'audio'` → `error.code` 为 `plugin.moderation.modality_not_supported`、
     `data.frameworkSupported: ["text"]`，且运行时 `totalRequests` 保持 3、Pod 数量不变
     （守卫在 invoke 之前，**未拉起子进程**）

5. **插件侧守卫**（不经宿主，证明插件自己也拦）：

   ```bash
   cd tmp-moderation-smoke
   node ../apps/cli/dist/index.js debug . --run --input '{"content":"x","modality":"audio"}'
   ```

   实测输出 `[error] Moderation modality not supported: audio` 而非审查结果；换成
   `--secrets '{"blockedKeywords":"badword"}' --input '{"content":"this has badword","modality":"text"}'`
   则打印 `verdict: "block"` 的摘要与完整 `{ status, result }`。

## 假设与预案

- **本版本只服务文本**：支持集常量 `SUPPORTED_MODERATION_MODALITIES = ['text']` 是唯一写入点。
  非文本请求在宿主与插件两处显式失败。多模态落地时：扩支持集 + 补 provider 侧异步实现 +
  引入 `pending` / `query` 事件与任务查询接口；`status` 已是信封字段，属纯增量。
- **严格度归 provider**：框架不校验、不落库、不改写档位。若某 provider 需要「我们这边的三档开关」，
  由该插件自行把档位映射到它控制台里预建的策略 ID，并写进插件 README。
- **`secretSchema` 扁平**：FastGPT 侧配置表单按单层渲染。若将来需要分组，改的是 SDK 的信封拼装
  与 `ctx.secrets` 读取路径，契约不受影响。
- **`content` 为 string**：text 模态为待审文本，image/audio/video 为 URL 或 data URI（为多模态预留）。
  local-pool 默认允许插件直连外网（`POOL_SERVICE_POD_ALLOW_NET` 只对 Node 26+ 的实验性权限模型
  生效，生产镜像 Node 22 必须保持 `false`），provider 可自行下载媒体；若某部署实测无外网，退路是
  FastGPT 侧下载后以 data URI 传入——只改适配器，契约不变。
- **`meta` 只放会被校验的声明**：见「强制不变量」第 4 条。`input.scene` / `sessionId` / `userId` /
  `userIp` / `dataId` / `partial` 是**透传字段**（对应厂商原生的 scene / SessionId / AssociateId
  等参数），框架不解释、不校验。
- **provider 原始响应不进标准结构**：排障由 provider 插件自己打日志（日志不得包含 content 全文与
  secrets），避免把大响应体跨进程复制。
- **不新增 `PluginTagSchema` 取值**：审查插件通过 `GET /plugins?types=moderation` 发现，不依赖 tag。
- **A1 的流帧改名是对外 breaking change（已按此落地）**：`sdk/client` 与 `sdk/factory` 的公开类型名
  由 `Tool*` 改为 `Plugin*`，线格式不变，两个包按 breaking 升到 `2.0.0`，CLI 模板依赖随之指向
  `^2.0.0`。

## 另开计划的范围

本次只交付上述框架。以下内容不在本计划内，需在框架落地后另开计划：

- 百度内容审核 provider 插件包（`packages/tools/*`，`fastgpt-official-plugins` 仓库）。
- 阿里云内容安全 provider 插件包（同上）。
- 图片 / 音视频模态的 provider 侧异步任务实现细节。
- **实时音视频流审查**（腾讯 IMS/AMS、阿里云 live stream）：这类接口是「提交一次 + 回调持续
  推送结果」模型，需要本仓库提供可被外部回调的入口与任务态存储（Redis），与现有
  request/response 通道不是同一形状。若要做，单独设计回调通道与任务仓储。
- **`checkStream` 事件**（单次会话内传入内容流 + 增量裁决）：transport 已支持 request 输入流
  （`request.waitForInputStream()`），但需要扩展共享流帧 union 以承载结构化增量结果，
  会波及 tool 通道与全部流帧消费方，因此单独成计划。
- **`docs/dev/how-to-devlop-plugin.md` / `.en.md` 的 moderation 端到端流程**：等真有 provider
  插件包（百度 / 阿里云）落地后再写，现阶段只留一处指向 `fastgpt-moderation-development` skill 的说明。
