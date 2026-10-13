# 实施计划：插件与工具元数据 i18n（不含应用模板）

## 目标

保持插件、工具及插件包元数据的 i18n 能力，并兼容已安装记录中的旧字符串格式；不要求数据库迁移、插件重装或重新上传。

## 范围

- 插件 `name`、`description`、`versionDescription`，工具集子工具 `name`、`description`。
- 插件输入/输出/密钥 JSON Schema 的 `x-i18n` UI 文案；标准 `title`、`description`、`placeholder` 仍为字符串。
- 面向模型的 `toolDescription` 保持其已有 `string | I18nString` 语义。
- 多语言 README 文件及 `readmeUrls`，继续兼容 `README.md` / `readmeUrl`。
- 已安装插件旧记录只在读取时归一化；新 plugin manifest 继续要求标准双语结构。

## 明确排除

- 不改造、翻译或迁移 `packages/infrastructure/src/static-data/workflow/templates/*/workflow.json`。
- Workflow 模板的 `name`、`intro`、节点/输入/输出文本仍按普通字符串透传；不把这些字段改成 `I18nString`，不增加 locale 参数或 workflow 模板翻译逻辑。
- `workflow/list` 与 SDK `listWorkflows()` 保持普通字符串响应；该接口若有独立功能变更，不属于本次 i18n 范围。

## 兼容约定

1. 插件旧字符串读为 `{ en: text, 'zh-CN': text }`；已有单语言对象用现有文本补齐必需语言。此回退不代表生成了真实翻译。
2. 兼容 Schema 只用于读取边界；manifest 校验和新写入保持严格，不把旧字符串格式继续写入数据库。
3. JSON Schema 的 `x-i18n` 保留完整映射，并按既有构建兼容规则同步普通字符串字段；旧包没有 `x-i18n` 时继续使用原字符串。
4. README 映射只包含包中实际存在的语言版本；旧字段保持可读。

## 验收

- 旧 Mongo 插件记录可通过读取、列表、工具摘要和运行路径；纯读取不更新数据库。
- 插件及子工具 i18n 字段读取后为标准对象，新 manifest 仍拒绝缺少必需语言的字段。
- Workflow 静态模板文件、领域类型、DTO、SDK 文档与 API 测试不再要求工作流文本为 i18n 对象。
- SDK Client 保持 `listWorkflows()` 透传，不做翻译或 locale 选择。

## 验证

- 插件 legacy 兼容、manifest 严格性、工具详情/摘要与 README 相关测试。
- Workflow 静态模板加载、API 路由/OpenAPI 和 SDK 透传测试，使用普通字符串数据。
- `pnpm typecheck` 与受影响文件 ESLint 检查。
