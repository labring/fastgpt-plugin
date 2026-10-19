# FastGPT-plugin SDK Client

Language: [简体中文](./README.md) | [English](./README.en.md)

The TypeScript client wraps the FastGPT Plugin service API. `FastGPTPluginClient` passes through service responses; it does not select display languages for callers.

```ts
import { FastGPTPluginClient } from '@fastgpt-plugin/sdk-client';

const client = new FastGPTPluginClient({
  baseUrl: 'https://plugin.example.com',
  token: process.env.FASTGPT_PLUGIN_TOKEN
});
```

## Workflow Templates

`listWorkflows()` takes no locale parameter and does not translate templates; fields such as `name` and `intro` pass through as strings. Workflow node configuration remains open-ended.

```ts
const templates = await client.listWorkflows();
const templateName = templates[0]?.name;
const firstInputLabel = templates[0]?.workflow.nodes[0]?.inputs?.[0]?.label;
```

## Localized Plugin README URLs

Plugin data preserves both the compatibility field `readmeUrl` and a `readmeUrls` map for variants that actually exist. The UI should select the current locale first, then fall back to Simplified Chinese and English. If the map still has no usable URL, use the legacy `readmeUrl` as a final fallback. The SDK does not parse README content or choose a locale.

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

`readmeUrls` contains only variants present in the package. The server points `readmeUrl` to `README.md` when present; otherwise it selects the first available variant in English, Simplified Chinese, then Traditional Chinese. The UI selects the current locale first, then falls back to Simplified Chinese and English, and finally uses the legacy `readmeUrl`. Older clients can continue reading only `readmeUrl`.

`PluginListType` is an array of plugin list items. `PluginListItemType` and `PluginSourceType` are also exported for handling the plugin `source` field.

## Plugin Service Features

`getPluginServiceFeatures()` returns the capabilities enabled on the current Plugin service:

```ts
const features = await client.getPluginServiceFeatures();
// { remoteDebug: boolean }
```
