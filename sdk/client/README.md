# FastGPT-plugin SDK Client

语言：[简体中文](./README.md) | [English](./README.en.md)

TypeScript 客户端封装 FastGPT Plugin 服务 API。`FastGPTPluginClient` 的方法会透传服务端响应；SDK 不替调用方选择展示语言。

```ts
import { FastGPTPluginClient } from '@fastgpt-plugin/sdk-client';

const client = new FastGPTPluginClient({
  baseUrl: 'https://plugin.example.com',
  token: process.env.FASTGPT_PLUGIN_TOKEN
});
```

## 工作流模板

`listWorkflows()` 不接收 locale 参数，也不会对工作流模板进行翻译；模板 `name`、`intro` 等字段按原字符串透传。工作流节点配置保持开放结构。

```ts
const templates = await client.listWorkflows();
const templateName = templates[0]?.name;
const firstInputLabel = templates[0]?.workflow.nodes[0]?.inputs?.[0]?.label;
```

## 多语言插件 README URL

插件信息会同时保留兼容字段 `readmeUrl` 和实际存在的 README 语言映射 `readmeUrls`。UI 应先按当前语言查映射，然后回退到简体中文、英文；若新映射没有可用地址，最后可使用旧 `readmeUrl`。SDK 不解析 README 内容或做语言选择。

```ts
type Locale = 'en' | 'zh-CN' | 'zh-Hant';

const plugins = await client.listPlugins();
const plugin = plugins[0];
const locale: Locale = 'zh-Hant';
const readmeUrl = plugin
  ? plugin.readmeUrls?.[locale] ??
    plugin.readmeUrls?.['zh-CN'] ??
    plugin.readmeUrls?.en ??
    plugin.readmeUrl
  : undefined;
```

`readmeUrls` 只包含包内实际提供的语言版本。服务端在根目录存在 `README.md` 时让 `readmeUrl` 指向它；否则按 `zh-CN`、`en`、`zh-Hant` 顺序选择可用变体。上述 UI 回退逻辑适用于展示端的语言选择；旧客户端仍可只读取 `readmeUrl`。

`PluginListType` 是插件列表项数组；`PluginListItemType` 和 `PluginSourceType` 也从客户端 SDK 导出，供调用方处理插件来源字段。

## Plugin 服务能力

`getPluginServiceFeatures()` 返回当前 Plugin 服务已启用的能力：

```ts
const features = await client.getPluginServiceFeatures();
// { remoteDebug: boolean }
```
