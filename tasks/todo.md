# 任务清单：插件与应用模板信息 i18n

## 已完成的只读审计

- [x] 审查现有 i18n schema、插件 manifest、SDK/CLI 构建和 `.pkg` 解析链路
- [x] 审查插件持久化、插件/工具 DTO、客户端透传及调试快照
- [x] 盘点 10 个静态工作流模板的顶层字段与嵌套节点/输入/输出字段
- [x] 识别边界：主产品 UI 不在本仓库；工作流模板是独立静态数据/API，不是插件 manifest

## 阶段 1：先定契约

### 任务 1：确认 i18n 字段范围与消费契约

**描述：** 已确认语言集合与回退、Schema `x-i18n` 结构、模型侧说明、README 语言变体、工作流 API 响应形状、调试策略及翻译范围；用户已批准计划与任务清单，后续实现按该契约进行。

**验收标准：**
- [x] 确认 `en`、`zh-CN` 必填，`zh-Hant` 可选；精确语言优先，回退到 `zh-CN` 再到 `en`，无 locale 上下文默认 `zh-CN`。
- [x] 确认 Schema 使用 `x-i18n` 对象，标准字符串字段保留并由构建器按 `zh-CN` 回填；旧格式继续兼容。
- [x] 确认模型侧 `toolDescription` 独立使用 i18n 对象；README 语言变体、映射和旧字段兼容规则已定。
- [x] 确认 workflow/list 直接返回 i18n 对象、不接收 locale，FastGPT UI/SDK 同步升级；平台翻译 key 保留原值。
- [x] 确认领域/SDK 类型显式声明关键工作流 i18n 文案，其余动态节点配置保持开放结构。
- [x] 确认模板分类标识、作者专名、单值 user guide URL、内置翻译责任、CLI `--lang` 与非目标范围。
- [x] 用户审阅并批准更新后的 `tasks/plan.md` 与 `tasks/todo.md` 后再开始实现。

**验证：**
- [x] 用户已确认本任务记录的契约决策。
- [x] 用户批准整份实施计划。

**依赖：** 无

**可能涉及文件：**
- `tasks/plan.md`
- `tasks/todo.md`

**预计范围：** 小（文档/契约确认）

### 检查点：契约审阅

- [x] 语言、字段、回退和兼容决策已确认
- [ ] FastGPT UI 工作区/具体负责人接入，以完成消费者联动验收（外部阻塞；验收案例已记录于任务 14）

## 阶段 2：插件工具元数据

### 任务 2：为输入/输出 Schema 字段增加 i18n 元数据

**描述：** 在 Factory SDK 输入、输出及密钥 Schema 元数据类型中支持 `x-i18n` 对象，覆盖面向 UI 的标题、说明、占位符等文案。JSON Schema 标准 `title`、`description` 等旧字符串字段保持原类型，CLI 构建时以 i18n 扩展为准回填 `zh-CN` 字符串。

**验收标准：**
- [x] SDK 元数据类型允许在输入、输出、密钥和工具集子工具字段中声明 `x-i18n` 文案对象。
- [x] Zod `.meta()` 至 `manifest.json` 保留扩展；CLI 显式将 `zh-CN` 回填至旧字符串字段。
- [x] 同时提供扩展和旧字段时扩展为准；旧 manifest 无扩展时原值继续有效。

**验证：**
- [x] `pnpm exec vitest run sdk/factory/src/tool-factory.test.ts`
- [x] `pnpm --filter @fastgpt-plugin/cli test -- src/build/index.spec.ts`
- [x] `pnpm typecheck`
- [x] 使用 CLI 实际构建多语言输入/输出示例并核对生成的 `manifest.json`。

**依赖：** 任务 1

**可能涉及文件：**
- `sdk/factory/src/index.ts`
- `sdk/factory/src/tool-factory.test.ts`
- `apps/cli/src/build/index.ts`
- `apps/cli/src/build/index.spec.ts`

**预计范围：** 中（SDK 与构建验证）

### 任务 3：保留多语言的模型侧工具说明

**描述：** 让插件作者可为顶层工具、工具集子工具及输入参数提供多语言 `toolDescription` i18n 对象；该字段与 UI 标签分开。调整 manifest schema、Factory SDK 类型和 CLI 构建，不再将说明静态压为单一语言。

**验收标准：**
- [x] 顶层工具、子工具及输入参数的模型侧 `toolDescription` 均可使用 i18n 对象。
- [x] CLI manifest 构建保留完整映射，供运行宿主按模型请求语言选择说明；宿主运行时的实际语言选择属于外部消费端验收。
- [x] 老 manifest 的字符串说明仍可加载，不将旧单一文案伪装成双语翻译。

**验证：**
- [x] `pnpm exec vitest run sdk/factory/src/tool-factory.test.ts`
- [x] `pnpm --filter @fastgpt-plugin/cli test -- src/build/index.spec.ts`
- [x] `pnpm typecheck`
- [x] 检查新旧 manifest 样例的构建输出（测试覆盖旧字符串和新 i18n 对象）。

**依赖：** 任务 1

**可能涉及文件：**
- `packages/domain/src/value-objects/plugin/plugin-manifest.vo.ts`
- `sdk/factory/src/manifest.type.ts`
- `sdk/factory/src/tool-factory.ts`
- `apps/cli/src/build/index.ts`
- `apps/cli/src/build/index.spec.ts`

**预计范围：** 中（SDK manifest 与 CLI 构建）

### 任务 4：贯通工具说明与 Schema 元数据的服务端传递

**描述：** 验证并补齐服务端持久化、工具详情/摘要 DTO 对新增 i18n 字段的保留；输入 Schema 的 `isToolParam` 兼容归一化不得覆盖本地化扩展；工具集子项和输出 Schema 使用同一规则。调试快照与远程 debug metadata 在任务 5 处理。

**验收标准：**
- [x] 插件记录序列化/反序列化后保留根级及子级 input/output/secret Schema 的 `x-i18n` 元数据。
- [x] 工具列表摘要和详情不丢失顶层、子工具及参数级 i18n `toolDescription`。
- [x] 输入参数兼容归一化不覆盖新 i18n 对象；旧 Schema 与字符串说明继续可用。

**验证：**
- [x] `pnpm exec vitest run packages/infrastructure/src/plugin/tool.impl.test.ts packages/infrastructure/src/plugin/plugin.repo.test.ts`
- [x] `pnpm typecheck`
- [x] 用仓库的 plugin repo/DTO/API 契约测试核对 i18n 字段透传。
- [ ] 对已部署服务的真实插件详情/工具摘要响应做外部联验（当前没有目标服务或 UI 工作区）。

**依赖：** 任务 2、任务 3

**可能涉及文件：**
- `packages/domain/src/entities/tool.entity.ts`
- `packages/infrastructure/src/plugin/plugin.repo.ts`
- `packages/infrastructure/src/plugin/tool.impl.ts`
- `packages/infrastructure/src/plugin/plugin.repo.test.ts`
- `packages/infrastructure/src/plugin/tool.impl.test.ts`

**预计范围：** 中（服务端存储和工具 API 路径）

### 任务 5：保留 CLI 与远程调试中的多语言元数据

**描述：** CLI 本地调试增加 `--lang <locale>` 并以 `zh-CN` 为默认显示语言；远程调试快照与 metadata 传递保留完整的插件/工具 i18n 对象，overlay 不将单语言字符串伪装成双语映射。

**验收标准：**
- [x] 本地调试可按 `--lang` 选择语言，缺省时显示简体中文。
- [x] `pluginDebug` 元数据传递保留 i18n 对象，远程调试侧不永久扁平化语言映射。
- [x] 旧 CLI 调试参数及旧调试 metadata 仍兼容。

**验证：**
- [x] `pnpm --filter @fastgpt-plugin/cli test -- src/commands/debug.spec.ts`
- [x] `pnpm exec vitest run packages/infrastructure/src/plugin/debug-plugin.repo.test.ts`
- [x] `pnpm typecheck`

**依赖：** 任务 3、任务 4

**可能涉及文件：**
- `apps/cli/src/debug/session.ts`
- `apps/cli/src/commands/debug.ts`
- `apps/cli/src/commands/debug.spec.ts`
- `packages/infrastructure/src/plugin/debug-plugin.repo.ts`
- `packages/infrastructure/src/plugin/debug-plugin.repo.test.ts`

**预计范围：** 中（本地调试展示和远程调试元数据适配）

## 阶段 3：README 语言变体

### 任务 6：CLI 构建与检查支持多语言 README

**描述：** 按 `README.<locale>.md` 命名约定复制实际存在的语言变体到构建产物；检查器兼容仅有旧 `README.md` 的项目，并验证非法文件名/重复 locale 行为。

**验收标准：**
- [x] CLI build/pack 会包含全部识别的 README 变体。
- [x] 老项目只有 `README.md` 时仍可构建和打包。
- [x] 错误文件名或重复 locale 的行为有测试覆盖。

**验证：**
- [x] `pnpm --filter @fastgpt-plugin/cli test -- src/build/index.spec.ts src/check/index.spec.ts`
- [x] `pnpm typecheck`
- [x] 用临时多语言插件实际执行 CLI build/pack，并检查 `.pkg` 文件清单及各 README 内容。

**依赖：** 任务 1

**可能涉及文件：**
- `apps/cli/src/build/index.ts`
- `apps/cli/src/build/index.spec.ts`
- `apps/cli/src/check/index.ts`
- `apps/cli/src/check/index.spec.ts`

**预计范围：** 中（CLI 打包链路）

### 任务 7：服务端解析并保存 README 语言变体

**描述：** 扩展 `.pkg` 解析器、包文件类型和插件包 resolver，使 `README.<locale>.md` 变体都可被识别、验证、保存并关联到 locale；继续读取旧 `README.md`。

**验收标准：**
- [x] parser 能识别已确认命名格式的 README 文件并拒绝歧义/冲突文件名。
- [x] resolver 为每种语言保存独立资源，且不会将它们误当成普通 asset。
- [x] 单文件 README 与无 README 的旧包行为不变。

**验证：**
- [x] `pnpm exec vitest run packages/infrastructure/src/plugin/utils/pkg-parser.test.ts packages/infrastructure/src/plugin/utils/plugin-pkg-file-resolver.impl.test.ts`
- [x] `pnpm typecheck`
- [x] resolver 集成测试使用旧 `.pkg` 和含多语言 README 的 `.pkg` 执行解析/保存流程。

**依赖：** 任务 6

**可能涉及文件：**
- `packages/domain/src/value-objects/file/pkg-file.vo.ts`
- `packages/infrastructure/src/plugin/utils/pkg-parser.ts`
- `packages/infrastructure/src/plugin/utils/pkg-parser.test.ts`
- `packages/infrastructure/src/plugin/utils/plugin-pkg-file-resolver.impl.ts`
- `packages/infrastructure/src/plugin/utils/plugin-pkg-file-resolver.impl.test.ts`

**预计范围：** 中（解析与文件持久化）

### 任务 8：持久化并暴露多语言 README URL

**描述：** 在插件解析、资源 URL 刷新、Mongo 记录和领域插件模型中持久化 `locale -> URL` 映射；保持旧 `readmeUrl` 可读。API DTO 与 SDK 输出字段在任务 9 中单独处理。

**验收标准：**
- [x] 插件安装、确认和资源刷新后均保留真实存在的 locale 到 README 文件 URL 映射，不虚构缺失语言的 URL。
- [x] 根 `README.md` 存在时旧 `readmeUrl` 指向该文件；否则按 `zh-CN`、`en`、`zh-Hant` 顺序指向首个存在的变体。
- [x] 既有仅含 `readmeUrl` 的 Mongo 记录无需破坏性迁移即可读取：新增字段为 optional，不需数据库迁移。

**验证：**
- [x] `pnpm exec vitest run packages/infrastructure/src/plugin/plugin.repo.test.ts packages/infrastructure/src/plugin/utils/pkg-parser.test.ts`
- [x] `pnpm typecheck`
- [x] repo/loader/codec 测试验证资源映射和刷新；兼容旧记录由 optional schema/model 字段保证，未连接真实 Mongo 实例。

**依赖：** 任务 7

**可能涉及文件：**
- `packages/domain/src/entities/plugin-base.entity.ts`
- `packages/infrastructure/src/storage/mongo/models/plugin.model.ts`
- `packages/infrastructure/src/plugin/utils/tool-loader.ts`
- `packages/infrastructure/src/plugin/codec/tool.codec.ts`
- `packages/infrastructure/src/plugin/plugin.repo.ts`

**预计范围：** 中（存储/资源/插件模型）

### 任务 9：公开 README URL 映射并更新客户端类型

**描述：** 将多语言 URL 映射纳入插件 DTO 与 SDK 客户端类型，补充 API 响应和向后兼容测试，便于外部市场 UI 按当前语言选择 README。

**验收标准：**
- [x] 插件列表、插件上传结果及工具摘要包含稳定的多语言 README URL 类型（依任务 1 确认的公开字段）。
- [x] SDK 类型准确反映新字段，现有 `readmeUrl` 调用不回归。
- [x] SDK 类型暴露 locale 到 URL 的映射；语言选择/回退由消费端实现，不在纯类型别名中隐式实现。

**验证：**
- [x] `pnpm exec vitest run sdk/client/src/client.test.ts packages/infrastructure/src/plugin/plugin.repo.test.ts`
- [x] `pnpm typecheck`
- [x] SDK 响应测试核对 `readmeUrls` 和兼容 `readmeUrl` 透传；旧字段为 optional，未对部署中的旧客户端做外部联验。

**依赖：** 任务 8

**可能涉及文件：**
- `packages/interface-adapter/src/contracts/dto/plugin.dto.ts`
- `packages/interface-adapter/src/contracts/dto/tool.dto.ts`
- `sdk/client/src/types.ts`
- `sdk/client/src/client.test.ts`

**预计范围：** 小到中（DTO 与客户端契约）

## 检查点：插件元数据

- [x] 工具字段标签/说明、模型说明、README 语言变体均从 SDK/CLI 到仓库 API 契约路径保留
- [x] 旧 `.pkg`、README、可选数据库字段和客户端字段的兼容行为由测试/类型契约覆盖
- [ ] FastGPT 插件市场 UI 接入映射与语言选择（外部阻塞；验收案例在任务 14 记录）

## 阶段 4：应用/工作流模板

### 任务 10：为工作流模板关键 i18n 字段建立类型契约

**描述：** 将模板 API 的用户可见字段定义为 `I18nString` 对象，并在领域 schema、DTO、OpenAPI 和 SDK 类型中显式声明模板级文案及节点名称/说明、输入标签/说明/占位符/模型说明、输出标签/说明等关键字段。节点其余配置保持开放结构；接口不增加 locale 请求参数。确认 `common:`、`core.*` key 在语言槽位中的表示。

**验收标准：**
- [x] 模板级及工作流节点/输入/输出关键文案字段均具备明确的 i18n 对象类型。
- [x] `workflow/list` 无 locale 参数，SDK 响应类型能识别嵌套 i18n 文案；动态节点其余配置仍可透传。
- [x] ID、key、枚举、URL、机器默认值等保持原类型和执行语义；平台翻译 key 按约定保留。

**验证：**
- [x] `pnpm exec vitest run sdk/client/src/client.test.ts`
- [x] `pnpm typecheck`
- [x] 检查 workflow/list OpenAPI/SDK route 契约：文案字段为 i18n 对象，接口不增加 locale 请求参数。

**依赖：** 任务 1

**可能涉及文件：**
- `packages/domain/src/entities/workflow.entity.ts`
- `packages/interface-adapter/src/contracts/dto/workflow.dto.ts`
- `packages/interface-adapter/src/contracts/route/workflow.contract.ts`
- `sdk/client/src/types.ts`
- `sdk/client/src/client.test.ts`

**预计范围：** 中（领域/接口/SDK 请求契约）

### 任务 11：贯通 workflow/list 的 i18n 对象响应

**描述：** 更新静态模板加载与 workflow/list route，使 i18n 对象从 `workflow.json` 原样到达 API 响应；不在服务端按 locale 扁平化。由 FastGPT UI 使用当前界面语言解析普通译文和平台 key。

**验收标准：**
- [x] API 响应中模板卡片及嵌套 workflow 展示文案为 i18n 对象，`workflow/list` 不要求 locale 参数。
- [x] 默认值、ID、key、枚举、URL、密钥和机器执行内容保持原值。
- [x] API/SDK 类型测试证明字段对象形状；FastGPT UI 联动验收列为端到端发布前置项。

**验证：**
- [x] `pnpm exec vitest run packages/infrastructure/src/static-data/workflow/init.test.ts`
- [x] `apps/server/src/routes/workflow.route.test.ts` route 契约测试已新增并运行。
- [x] `pnpm typecheck`

**依赖：** 任务 10

**可能涉及文件：**
- `packages/infrastructure/src/static-data/workflow/init.ts`
- `packages/infrastructure/src/static-data/workflow/init.test.ts`
- `apps/server/src/routes/workflow.route.ts`
- `apps/server/src/routes/workflow.route.test.ts`（新增）

**预计范围：** 中（模板解析与 API 实现）

### 任务 12：迁移第一组 5 个工作流模板文案

**描述：** 依据已确认字段清单，为第一组模板的用户可见字段填充 `I18nString` 对象；中英文由维护者提供并人工校对，繁体可选。把平台 `common:`、`core.*` 翻译 key 原样置于对应语言对象中。

**模板：** `CQ`、`Chinese`、`TranslateRobot`、`githubIssue`、`google`。

**验收标准：**
- [x] 模板级 `name`、`intro`，节点 `name`/`intro`，输入的 `label`/`description`/`placeholder`/`toolDescription`/`debugLabel`/`valueDesc`，输出的 `label`/`description`/`valueDesc` 等可见文案符合 i18n 契约。
- [x] 保留 `common:`、`core.*` 平台翻译 key 的含义；`tags`、`type`、`author`、ID、key、URL 和机器执行值不被错误改写。
- [x] 可见的静态预填文案按字段语义纳入，工作流图结构和执行配置通过结构签名回归测试。

**验证：**
- [x] `pnpm exec vitest run packages/infrastructure/src/static-data/workflow/init.test.ts`
- [x] `pnpm typecheck`
- [x] 模板 i18n 覆盖和机器配置回归测试覆盖本组模板；UI 导入/渲染联验留待外部 UI 工作区。

**依赖：** 任务 11

**可能涉及文件：**
- `packages/infrastructure/src/static-data/workflow/templates/CQ/workflow.json`
- `packages/infrastructure/src/static-data/workflow/templates/Chinese/workflow.json`
- `packages/infrastructure/src/static-data/workflow/templates/TranslateRobot/workflow.json`
- `packages/infrastructure/src/static-data/workflow/templates/githubIssue/workflow.json`
- `packages/infrastructure/src/static-data/workflow/templates/google/workflow.json`

**预计范围：** 中（五个模板数据文件）

### 任务 13：迁移其余 5 个工作流模板文案

**描述：** 按任务 12 的字段清单和迁移规则为剩余模板补齐 i18n 对象，不改变工作流执行语义。

**模板：** `longTranslate`、`srt-translate`、`flux`、`plugin-dalle`、`plugin-feishu`。

**验收标准：**
- [x] 所有纳入范围的卡片、节点、输入和输出可见文案均有英文/简体中文，繁体可选。
- [x] 保留现存平台翻译 key；按可见性语义审查静态预填值/prompt。
- [x] ID、key、枚举、URL、默认配置和执行结构通过结构签名回归测试保持不变。

**验证：**
- [x] `pnpm exec vitest run packages/infrastructure/src/static-data/workflow/init.test.ts`
- [x] `pnpm typecheck`
- [x] 模板 i18n 覆盖和机器配置回归测试覆盖剩余模板；UI 目标语言渲染/运行验收待外部 UI 工作区。

**依赖：** 任务 12

**可能涉及文件：**
- `packages/infrastructure/src/static-data/workflow/templates/longTranslate/workflow.json`
- `packages/infrastructure/src/static-data/workflow/templates/srt-translate/workflow.json`
- `packages/infrastructure/src/static-data/workflow/templates/flux/workflow.json`
- `packages/infrastructure/src/static-data/workflow/templates/plugin-dalle/workflow.json`
- `packages/infrastructure/src/static-data/workflow/templates/plugin-feishu/workflow.json`

**预计范围：** 中（五个模板数据文件）

## 阶段 5：覆盖检查与交付

### 任务 14：增加 i18n 覆盖检查并完成端到端验证

**描述：** 为静态工作流模板建立字段级 i18n 覆盖/结构回归测试，并对插件 Schema、模型说明、README 语言变体及 API 兼容性执行集成验证；确认英文/简体中文必填、繁体可选，平台 key 保持原样。此任务聚焦验证，不重复前序任务中的定向单元测试。

**验收标准：**
- [x] 自动检查所有承诺本地化的模板字段具备所需语言，且机器/执行字段未被迁移误伤。
- [x] 插件旧版 `.pkg`、旧 `README.md`、旧客户端兼容用例覆盖；Mongo 新字段为 optional，无破坏性迁移。
- [x] 外部 FastGPT UI 的验收案例与未解决问题已记录；没有 UI 工作区时标记为外部发布前置项。

**外部 UI 验收清单（尚未执行）：**
- [ ] 插件市场按当前 locale 选择 `readmeUrls`，缺失时回退，并继续兼容旧 `readmeUrl`。
- [ ] 工作流模板卡片及节点/输入/输出文案按当前 locale 显示，缺失语言回退到 `zh-CN` 再到 `en`。
- [ ] `common:`、`core.*` 平台翻译 key 正确解析；`workflow/list` 无 locale 参数且返回 i18n 对象。

**验证：**
- [x] `pnpm test`（51 个文件、387 项通过）
- [x] `pnpm --filter @fastgpt-plugin/cli test`（9 个文件、52 项通过）
- [x] `pnpm typecheck`
- [x] `pnpm build:sdk-factory && pnpm build:sdk-client && pnpm build:cli && pnpm build:server`
- [x] UI 不在当前工作区，已记录外部验收清单及发布阻塞；真实界面验收未执行。

**依赖：** 任务 2–13

**可能涉及文件：**
- `packages/infrastructure/src/static-data/workflow/init.test.ts`
- `packages/infrastructure/src/plugin/plugin.repo.test.ts`
- `packages/infrastructure/src/plugin/tool.impl.test.ts`

**预计范围：** 中（覆盖验证；业务回归测试已分布在前序任务）

### 任务 15：更新 SDK Factory/CLI/插件开发文档

**描述：** 更新中英文开发文档和 SDK skill，说明 Schema i18n 扩展、模型侧工具说明、README 语言变体和兼容/回退规则，并补充可复制的插件示例。

**验收标准：**
- [x] SDK Factory 中英文 README 和 skill 使用与实现一致的元数据字段示例。
- [x] CLI 中英文 README 解释 README 语言文件的命名与打包方式。
- [x] 文档明确旧字段兼容行为和语言回退规则。
- [ ] FastGPT API/UI 所有者复核文档中的公开契约（外部审阅待安排）。

**验证：**
- [x] `pnpm build:sdk-factory && pnpm build:cli`（已通过完整构建链验证）
- [x] 按文档示例实际构建插件、检查本地化 manifest，并将 README 变体打入 `.pkg`。
- [ ] FastGPT API/UI 所有者审阅文档中的公开契约（外部审阅待安排）。

**依赖：** 任务 2–14

**可能涉及文件：**
- `sdk/factory/README.md`
- `sdk/factory/README.en.md`
- `sdk/factory/skills/fastgpt-sdk-factory/SKILL.md`
- `apps/cli/README.md`
- `apps/cli/README.en.md`

**预计范围：** 中（五份文档）

### 任务 16：更新 SDK Client 的 i18n 响应文档

**描述：** 更新 SDK Client 中英文 README，说明 `listWorkflows()` 不传 locale 且返回工作流 i18n 对象，以及多语言 README URL map 的透传与旧字段兼容。

**验收标准：**
- [x] 文档示例与 `FastGPTPluginClient` 的最终返回类型一致。
- [x] 文档明确 workflow/list 返回 i18n 对象，由 FastGPT UI 按当前语言解析，不增加 locale 参数。
- [x] 文档说明 `readmeUrls` 映射、旧 `readmeUrl` 和语言回退责任归 UI 消费端。

**验证：**
- [x] `pnpm build:sdk-client`（已通过完整构建链验证）
- [x] 按文档示例编译一个调用 `listWorkflows()` 并读取 README URL map 的客户端代码。
- [ ] 与 FastGPT API/UI 所有者核对公开 contract 与兼容说明（外部审阅待安排）。

**依赖：** 任务 9–14

**可能涉及文件：**
- `sdk/client/README.md`
- `sdk/client/README.en.md`

**预计范围：** 小（两份客户端文档）

### 检查点：完成

- [x] 仓库内确认纳入的验收标准满足；外部 UI/owner review 项单独保留为发布前置项
- [x] 全量测试、类型检查和相关构建通过
- [x] 插件旧版兼容行为已由仓库测试覆盖
- [ ] 真实展示端验收尚未执行；FastGPT UI 工作区和 API/UI owner review 是已记录的外部发布前置项。
