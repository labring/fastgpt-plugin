# 实施计划：插件与应用模板信息 i18n

## 概览

补齐插件工具与 FastGPT 内置工作流模板中尚未国际化的用户可见文案，并贯通 SDK/CLI、`.pkg`、持久化、API 与消费端。插件基础名称、简介、版本说明及数据源表单等已有 i18n，不重复改造。本次工作流 API 将把选定的文案字段从字符串改为 i18n 对象，属于公开响应类型变更，需要 FastGPT 主产品 UI 与 SDK 消费端同步升级；UI 仓库当前不在工作区，实际展示验收需待其接入后完成。

## 只读审计结果

| 信息类别 | 当前状态 | 主要位置 |
| --- | --- | --- |
| 插件名称、简介、版本说明 | 已是 i18n 对象；英文与简体中文必填，繁体中文可选 | `packages/domain/src/value-objects/i18n-string.vo.ts`、`packages/domain/src/entities/plugin-base.entity.ts` |
| 工具集子工具名称/简介、数据源表单标签/占位符/说明 | 已是 i18n 对象 | `packages/domain/src/entities/tool.entity.ts`、`packages/domain/src/value-objects/dataset.vo.ts` |
| 工具及子工具的模型说明 `toolDescription` | manifest/构建/摘要中是普通字符串；CLI 会从插件简介选取单一语言；CLI 本地/远程调试快照也会将元数据压成单语言字符串。工具字段的 `toolDescription` 与 UI 标签是不同语义 | `packages/domain/src/value-objects/plugin/plugin-manifest.vo.ts`、`apps/cli/src/build/index.ts`、`apps/cli/src/debug/session.ts`、`packages/infrastructure/src/plugin/tool.impl.ts` |
| 输入/输出/密钥 schema 字段标签、说明等 | Zod `.meta()` 当前仅按普通 JSON Schema `title` / `description` 字符串生成；没有字段级语言选择约定。服务端输入 Schema 兼容逻辑会尝试从旧 `description.en` 取模型说明，但不等于 UI 标签 i18n；输出 Schema 不做同类归一化 | `sdk/factory/src/index.ts`、`apps/cli/src/build/index.ts`、`packages/infrastructure/src/plugin/tool.impl.ts` |
| README | 只复制/识别/存储一个 `README.md`，只提供一个 `readmeUrl` | `apps/cli/src/build/index.ts`、`packages/infrastructure/src/plugin/utils/pkg-parser.ts`、`packages/infrastructure/src/plugin/utils/tool-loader.ts`、插件 repo 与 DTO |
| 应用/工作流模板 | 10 个静态 `workflow.json`；顶层 `name`、`intro`、`tags`、`type`、`author`、`userGuide` 及图内节点名/说明、输入输出标签/描述/占位符、`valueDesc`、`debugLabel`、工具说明等为普通字符串，混有原始中文和 `common:` 翻译键；部分 `value` 是执行配置，部分可能是用户可见的预填文案，需逐字段判别 | `packages/infrastructure/src/static-data/workflow/templates/*/workflow.json`、`packages/domain/src/entities/workflow.entity.ts`、`packages/infrastructure/src/static-data/workflow/init.ts` |
| 展示端/API locale 处理 | `/workflow/list` 不接收语言参数；SDK 客户端透传数据，不负责语言选择；主产品 UI 不在本仓库 | `packages/interface-adapter/src/contracts/route/workflow.contract.ts`、`apps/server/src/routes/workflow.route.ts`、`sdk/client/src/client.ts` |
| 其他已覆盖或非目标字段 | 插件 tags/permissions 是平台枚举，显示文案由平台提供；图标、链接、ID、schema keys 等是资源或机器字段；动态工具运行结果不是 manifest 标签 | `packages/infrastructure/src/static-data/plugin-tag.ts`、`packages/domain/src/value-objects/system-var.vo.ts` 等 |

CLI 调试快照（`apps/cli/src/debug/session.ts`）和远程调试元数据适配（`packages/infrastructure/src/plugin/debug-plugin.repo.ts`）会把插件/工具 i18n 元数据压成单语言字符串。工作流模板候选文案包括 `nodes[].name/intro`、`inputs[].label/description/placeholder/toolDescription/debugLabel/valueDesc`、`outputs[].label/description/valueDesc` 及模板级 `name/intro`；现存 `common:`、`core.*` 是平台翻译 key。模板 `tags`、`type` 是平台标识，`author` 是专名；已确认 `userGuide` 的 `type` 和 URL 为单值。模板 `value`/prompt 需按可见性和可编辑性纳入，不翻译机器执行值。模型提供商名称已有 i18n；TTS `voices[].label` 是相邻范围，明确留作后续。

## 已确认的架构与兼容约定

1. **语言集合与回退。** 沿用 `I18nStringSchema` 的 `en`、`zh-CN` 必填和 `zh-Hant` 可选。消费端按精确 locale 优先，缺失时回退至 `zh-CN`，再到 `en`；没有语言上下文时默认 `zh-CN`。
2. **工具 Schema 文案。** 在 JSON Schema 标准字符串字段旁增加 `x-i18n` 扩展，例如 `x-i18n: { title: I18nString, description?: I18nString, placeholder?: I18nString }`。构建器以扩展为准，用 `zh-CN` 填充对应旧字符串字段；旧 manifest 没有扩展时保留原字段。参数级模型说明 `toolDescription` 与 UI 文案分开，使用 i18n 对象；旧包中的字符串继续兼容，不伪造重复翻译。Zod 4.3.6 会保留任意 `.meta()` 扩展到 JSON Schema，但不会自动回填标准字段，因此 CLI 必须显式转换。
3. **README 语言变体。** 支持 `README.en.md`、`README.zh-CN.md`、`README.zh-Hant.md`。`readmeUrls` 只列包内实际存在的变体；继续兼容 `README.md` 与 `readmeUrl`。若根 `README.md` 不存在，旧 `readmeUrl` 按 `zh-CN`、`en`、`zh-Hant` 顺序指向第一个存在的变体。消费者先按精确语言选取，再按既定规则回退，最后使用兼容字段。
4. **工作流模板字段与 API。** 模板中纳入范围的用户可见字段直接改为 i18n 对象；`/workflow/list` 不接收 locale 参数，返回 i18n 对象，由 FastGPT UI 根据当前语言选择。领域/SDK 类型显式声明工作流节点名/说明、输入标签/说明/占位符/模型说明、输出标签/说明等关键文案字段为 i18n 对象；其余节点配置保持开放结构，避免将动态工作流字段收窄。现有 `common:` 和 `core.*` 翻译 key 在各语言槽位中原样保留，由 UI 的平台翻译目录解析。模板 `tags`、`type` 是平台标识，由 UI 本地化；`author` 保持专名字符串；`userGuide` 的类型与 URL 保持单值。静态模板中实际会展示或供用户编辑的预填文案/prompt 按语义纳入，机器执行值不翻译。
5. **兼容与消费端。** 工作流响应字段改成对象属于公开类型变更，FastGPT UI/SDK 消费端需同步升级；不另保留平行的 `nameI18n` 等字段。Schema 标准字符串保留给旧消费者。插件旧模型说明和 README 继续兼容。
6. **调试与范围边界。** CLI 调试新增 `--lang <locale>`，默认 `zh-CN`；远程调试元数据保留完整 i18n 对象。插件运行结果、运行时用户自定义名称及 prompt/配置值、CLI/API 自身错误文案不纳入。TTS 模型 `voices[].label` 留作后续事项。
7. **翻译责任。** 插件作者提供插件文案翻译；本仓库维护者补齐 10 个内置工作流模板的英文和简体中文并人工校对，繁体可选。FastGPT UI 不在本工作区，展示适配与验收作为联动交付及完整发布前置条件。

## 任务索引

### 阶段 1：确定字段契约
- [x] 任务 1：确认 i18n 字段范围与消费契约

### 检查点：契约审阅
- [x] 确认输入/输出 Schema 使用 `x-i18n` 对象，并保留标准字符串字段
- [x] 确认 README 变体、旧字段兼容与语言回退顺序
- [x] 确认 workflow/list 直接返回 i18n 对象、不传 locale，并需要 UI/SDK 同步升级
- [ ] FastGPT UI 的具体仓库/负责人接入，并确认联动验收安排（外部阻塞）

### 阶段 2：插件工具元数据
- [x] 任务 2：为输入/输出 Schema 字段增加 i18n 元数据
- [x] 任务 3：保留多语言的模型侧工具说明
- [x] 任务 4：贯通工具说明与 Schema 元数据的服务端传递
- [x] 任务 5：保留 CLI 与远程调试中的多语言元数据

### 检查点：插件工具元数据
- [x] 工具、工具集子项的输入/输出/密钥 Schema 与说明覆盖一致
- [x] 服务端持久化、摘要、详情及调试路径保留 i18n 信息

### 阶段 3：README 语言变体
- [x] 任务 6：CLI 构建与检查支持多语言 README
- [x] 任务 7：服务端解析并保存 README 语言变体
- [x] 任务 8：持久化并暴露多语言 README URL
- [x] 任务 9：公开 README URL 映射并更新客户端类型

### 检查点：插件 README
- [x] 旧 `.pkg`、`README.md`、数据库记录及旧客户端继续可用
- [x] 通过 CLI 构建、服务端解析、插件查询的链路测试

### 阶段 4：应用/工作流模板
- [x] 任务 10：为工作流模板关键 i18n 字段建立类型契约
- [x] 任务 11：贯通 workflow/list 的 i18n 对象响应
- [x] 任务 12：迁移第一组 5 个工作流模板文案
- [x] 任务 13：迁移其余 5 个工作流模板文案

### 检查点：应用模板
- [x] 10 个模板卡片和工作流图中纳入范围的可见文案均满足语言要求
- [x] workflow/list 直接返回 i18n 对象，不引入 locale 请求参数
- [ ] FastGPT UI/SDK 已同步升级并在当前语言下解析文案及平台翻译 key（外部发布前置项）

### 阶段 5：覆盖检查与交付
- [x] 任务 14：增加 i18n 覆盖检查并完成仓库内验证
- [x] 任务 15：更新 SDK Factory/CLI/插件开发文档
- [x] 任务 16：更新 SDK Client 的 i18n 响应文档

## 风险与缓解

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| workflow/list 中原字符串改为 i18n 对象 | 旧客户端会因响应类型变化而不兼容 | FastGPT UI/SDK 与插件服务同步升级；将 UI 接入及实际展示列为完整发布前置条件 |
| 主产品 UI 不在当前仓库 | 服务端字段齐全仍不能证明实际显示正确，平台 key 也需 UI 翻译目录解析 | 实现 UI 联动前附加对应工作区；端到端验证平台 key 解析和 locale 回退 |
| 工作流图结构动态且庞大 | 全面封闭 schema 可能丢失 FastGPT 动态字段或增加维护成本 | 只为关键 i18n 文案字段补充类型，其余 nodes/edges 配置维持开放结构 |
| JSON Schema 的 `title` / `description` 有标准语义 | 把对象直接写入标准字段会破坏 schema 消费方 | 保留标准字符串，使用 `x-i18n` 并由构建器同步生成旧字符串值 |
| 模板图节点内存在配置值、机器标识与面向用户文案混杂 | 批量翻译可能误改工作流语义或执行数据 | 按字段语义清单迁移；对 keys、枚举、URL、密钥和机器默认值做结构回归检查 |
| README 多语言影响旧 package 和既有 URL | 旧插件/客户端可能无法显示说明 | 兼容读取旧 `README.md` 和 `readmeUrl`，测试旧包以及无默认语言 README 的回退 |
| 模板翻译质量 | i18n 槽位齐全但译文质量不达标 | 内置模板英文/简体中文由维护者补齐并人工校对；繁体可选 |

## 计划审阅门槛

- [x] 用户确认本计划采用的 i18n 与兼容约定。
- [x] 用户已审阅并批准本版 `tasks/plan.md` 与 `tasks/todo.md`，据此开始实施。
- [ ] FastGPT UI 工作区接入并完成联动实现/展示验收；这项是端到端完成及发布前置条件。验收清单：插件市场按当前 locale 选择 `readmeUrls`，缺失时回退并继续支持 `readmeUrl`；模板卡片及节点/输入/输出文案按当前 locale 显示，平台 `common:`/`core.*` key 正确解析，缺失语言回退到 `zh-CN` 再到 `en`；`workflow/list` 请求无 locale 参数且响应字段为 i18n 对象。UI 工作区及负责人尚未接入，本仓库未能进行真实界面验收。
