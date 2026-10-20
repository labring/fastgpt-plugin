# FastGPT 侧插件多语言元数据接入参考

## 目的与边界

本说明供 FastGPT 应用侧消费 Plugin 服务提供的多语言插件元数据。Plugin 服务保留并返回原始多语言结构；FastGPT UI 按界面语言选择文本，构造模型工具描述时使用 Workflow 节点保存的 `metadataLocale` 快照，而不是按每次 scheduler/API 请求的 `lang` 重新选择。

本次契约只涉及插件与工具元数据，不涉及 FastGPT 内置应用/Workflow 模板。Workflow 模板的 `name`、`intro`、节点字段继续使用普通字符串；`workflow/list` 不增加 locale 参数、不做本地化。

## 接口与字段

相关接口契约：

- `GET /plugins`：插件列表项。列表项不含 `versionDescription`、`permission`。
- `GET /tools`：工具列表及工具集子工具摘要。
- `GET /tool`：单个工具详情，包括输入、输出和密钥 JSON Schema。

上述响应字段保留多语言对象，不按请求语言压平成字符串。`GET /plugins` 当前过滤参数为 `types`、`tags`、`op`、`sources`，没有 locale 参数。

| 数据字段 | 形态 | FastGPT 侧用途 |
| --- | --- | --- |
| 插件 `name` | `I18nString` | 插件卡片、详情、选择器 |
| `versionDescription` | `I18nString`，可选 | 版本说明；在插件详情/版本信息中展示 |
| 工具集子工具 `name` | `I18nString` | 子工具选择器 |
| 插件及子工具 `description` | `I18nString` | UI 展示与工具描述的唯一来源；UI 按界面语言选择，模型描述按节点 `metadataLocale` 选择 |
| JSON Schema 的 `x-i18n.title`、`x-i18n.description`、`x-i18n.placeholder` | 各自为 `I18nString` | 输入表单、密钥表单、结果/字段说明 |
| `readmeUrls` | 部分语言到 URL 的映射 | 打开当前语言 README；只包含包中存在的语言版本 |
| `readmeUrl` | URL，可选 | 旧版 README URL 兼容字段 |

`I18nString` 的当前规范是 `en` 和 `zh-CN` 必需、`zh-Hant` 可选。例如：

```json
{
  "en": "Search documents",
  "zh-CN": "搜索文档",
  "zh-Hant": "搜尋文件"
}
```

插件的 `inputSchema`、`outputSchema` 和 `secretSchema` 是 JSON Schema。`x-i18n` 可在各字段的 schema 节点上提供本地化 UI 文案：

```json
{
  "type": "string",
  "title": "Query",
  "description": "Text to search for",
  "placeholder": "Enter a query",
  "x-i18n": {
    "title": { "en": "Query", "zh-CN": "搜索内容" },
    "description": { "en": "Text to search for", "zh-CN": "用于检索的文本" },
    "placeholder": { "en": "Enter a query", "zh-CN": "输入查询文本" }
  }
}
```

普通 JSON Schema 的 `title`、`description`、`placeholder` 仍是字符串。当前 CLI 构建保留完整的 `x-i18n`，并将相应的英文文案复制到这些普通字段，作为旧消费者的稳定 fallback。FastGPT 新 UI 应优先读 `x-i18n`；旧插件没有 `x-i18n` 时继续显示普通字符串。

## FastGPT 消费建议

### 1. 在展示边界解析多语言值

不要在 API client、缓存层或数据库层提前把多语言对象替换为单个字符串；否则相同缓存无法服务不同语言的用户。共享一个选择函数，在 UI 展示时按界面语言选择插件名、简介和 Schema 标签；构造模型工具描述时传入 Workflow 节点保存的 `metadataLocale`。

```ts
type Locale = 'en' | 'zh-CN' | 'zh-Hant';
type I18nText = string | Partial<Record<Locale, string>>;

function selectPluginText(value: I18nText | undefined, locale: Locale): string {
  if (typeof value === 'string') return value; // 旧响应/缓存兼容
  if (!value) return '';

  return value[locale] ?? value['zh-CN'] ?? value.en ?? '';
```

选择规则：先精确匹配当前语言，再回退到简体中文，最后回退到英文。构造模型工具描述时，选择语言来自节点保存的 `metadataLocale`；UI 文案则使用界面语言。旧数据库中的字符串会由 Plugin 服务在读取时归一化，但前端保留字符串兼容可以覆盖旧缓存或旧服务响应。

### 2. 使用唯一的 description 字段

- 插件和子工具的 `name`、`description` 用于 UI。
- Schema 的 `x-i18n` 用于字段标题、说明和占位符。
- 插件和子工具的 `description` 是唯一用户可见的描述来源；模型描述按节点 `metadataLocale` 选择，Schema 的 `x-i18n.description` 用于字段说明。
- 旧 `toolDescription` 不作为 FastGPT 的用户可见文案或模型描述来源；服务端会保留并返回该字段。旧输入 Schema 字段上的 `toolDescription` 仅在 `isToolParam` 未显式设置时用于推导 `isToolParam: true`，显式值优先。
- 若 `x-i18n` 缺失，使用现有字符串字段；Schema 的 JSON 属性名仍作为 `title` 缺失时的 UI 兜底。

### 3. 选择 README URL

按当前 locale 选 `readmeUrls`；缺失时依次回退到简体中文、英文，最后使用兼容字段 `readmeUrl`。不要假设 `readmeUrls` 一定含有三种语言：它只记录包中实际提供的 README 文件。

```ts
function selectReadmeUrl(
  plugin: { readmeUrls?: Partial<Record<Locale, string>>; readmeUrl?: string },
  locale: Locale
): string | undefined {
  return plugin.readmeUrls?.[locale] ??
    plugin.readmeUrls?.['zh-CN'] ??
    plugin.readmeUrls?.en ??
    plugin.readmeUrl;
}
```

### 4. 保持服务端传输字段结构

插件列表、工具列表与详情使用相同的多语言数据结构；API client 应保留对象及 schema 扩展字段。UI 与模型描述都在消费边界选择语言，模型描述选择节点的 `metadataLocale`。不要要求 Plugin API 根据浏览器语言改写 DTO，也不要把多语言值持久化为 UI 当前选中的字符串。

## 插件包与旧记录兼容

- 新 plugin manifest 的 `name`、`description` 必须提供 `en` 与 `zh-CN`；`versionDescription` 若提供，也使用该双语结构。`zh-Hant` 可选。工具集子工具的 `name`、`description` 同样遵守该要求。
- 旧 manifest、JSON Schema 和数据库记录中的 `toolDescription` 保留兼容读取；输入 Schema 字段上的旧 `toolDescription` 仅用于推导缺省 `isToolParam`，不会替代 `description`。服务端不迁移或回写历史记录。
- Plugin 服务读取旧数据库记录时，会在内存中把旧字符串/部分语言对象归一化，不执行数据库迁移或读时回写。补齐缺失语言只为兼容结构，不代表生成了真实译文。
- `readmeUrl` 继续可读；新字段 `readmeUrls` 只列出实际存在的 README 语言版本。

FastGPT 侧不需要触发插件重装、重新上传或数据库迁移。旧缓存中的 `toolDescription` 不作为独立文案展示；Plugin 服务可能在响应中原样保留它，以兼容旧输入 Schema 的 `isToolParam` 推导。

## 验收清单

- [ ] `/plugins` 中中英文插件名、描述随 UI locale 正确呈现；没有对应语言时按规则回退。
- [ ] `/tools` 和 `/tool` 中插件及子工具元数据使用相同的选择规则。
- [ ] 输入、输出、密钥表单优先使用 `x-i18n`；旧 schema 仍显示普通字符串。
- [ ] 插件及子工具的 `description` 按节点保存的 `metadataLocale` 构造模型描述；旧 `toolDescription` 不覆盖它。
- [ ] README 缺少当前 locale 时可回退到兼容 URL。
- [ ] `workflow/list` 及内置 Workflow 模板仍为字符串透传，不加入这次插件元数据改造。

## 仓库内契约来源

- `packages/domain/src/value-objects/i18n-string.vo.ts`
- `packages/domain/src/value-objects/plugin/plugin-manifest.vo.ts`
- `packages/interface-adapter/src/contracts/dto/plugin.dto.ts`
- `packages/interface-adapter/src/contracts/dto/tool.dto.ts`
- `packages/interface-adapter/src/contracts/route/plugin.contract.ts`
- `packages/interface-adapter/src/contracts/route/tool.contract.ts`
- `apps/cli/README.md` 与 `sdk/factory/README.md`
