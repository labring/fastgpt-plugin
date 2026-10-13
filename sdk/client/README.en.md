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

## Workflow Template i18n

`listWorkflows()` takes no locale parameter and preserves i18n objects in template cards and workflow node text. Application UIs should select text using the current interface locale. When that locale is missing, fall back to `zh-CN`, then `en`; `zh-Hant` is optional. Platform translation keys such as `common:` and `core.*` are passed through unchanged and must be resolved using the FastGPT UI translation catalog.

```ts
import type { I18nStringType } from '@fastgpt-plugin/sdk-client';

type Locale = 'en' | 'zh-CN' | 'zh-Hant';

function selectText(text: I18nStringType, locale: Locale): string {
  return text[locale] || text['zh-CN'] || text.en;
}

const templates = await client.listWorkflows();
const templateName = templates[0]
  ? selectText(templates[0].name, 'en')
  : undefined;
const firstNodeName = templates[0]?.workflow.nodes[0]
  ? selectText(templates[0].workflow.nodes[0].name, 'en')
  : undefined;
```

The SDK passes through i18n fields for nested node `name`/`intro`, input/output labels and descriptions, while keeping other dynamic node configuration open. `listWorkflows()` calls `/api/workflow/list` without a locale query parameter.

## Localized Plugin README URLs

Plugin data preserves both the compatibility field `readmeUrl` and a `readmeUrls` map for README variants that actually exist. A UI should first select the current locale, then fall back to Simplified Chinese and English. If no mapped URL is available, use the legacy `readmeUrl` as a final fallback. The SDK does not parse README content or choose a locale.

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

`readmeUrls` contains only the locales supplied in the package. If a root `README.md` exists, the server points `readmeUrl` to it; otherwise it selects the first available variant in `zh-CN`, `en`, then `zh-Hant` order. The locale-selection example above is for the display client; older clients can continue reading only `readmeUrl`.

`PluginListType` is an array of plugin list items. `PluginListItemType` and `PluginSourceType` are also exported for handling the plugin `source` field.

## Plugin Service Features

`getPluginServiceFeatures()` returns the capabilities enabled on the current Plugin service:

```ts
const features = await client.getPluginServiceFeatures();
// { remoteDebug: boolean }
```
