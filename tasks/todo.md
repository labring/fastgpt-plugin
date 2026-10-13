# 任务清单：插件元数据兼容（不含应用模板 i18n）

## 本次范围

- 插件/工具元数据、Schema `x-i18n`、多语言 README 与旧插件数据库记录兼容。
- 应用/工作流模板 i18n 明确排除；10 个 `workflow.json` 恢复为原始内容，模板领域类型与 SDK/API 契约保持字符串形态。

## 完成项

- [x] 增加旧插件字符串及部分 i18n 对象的读取时归一化，不批量改写数据库。
- [x] 插件与子工具元数据读取后标准化，写入 manifest 仍保持严格双语校验。
- [x] 覆盖仓库插件读取、列表、工具摘要、运行路径及读取不写库行为。
- [x] 保留插件 Schema 的 `x-i18n` 与标准 JSON Schema 字符串兼容字段。
- [x] 保留 README 多语言 URL 与旧 `readmeUrl` 兼容。
- [x] 移除应用模板翻译、i18n Schema、测试和说明；Workflow API/SDK 继续透传字符串，不做 locale 选择。

## 最终验证

- [x] Workflow API、静态模板加载及 SDK Client 定向测试使用普通字符串。
- [x] 聚焦兼容、manifest、Workflow 和 SDK 测试：7 个文件，50 项通过。
- [x] `pnpm typecheck` 与受影响 TypeScript 文件的 ESLint 检查通过。
