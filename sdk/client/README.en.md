# FastGPT-plugin SDK Client

Language: [简体中文](./README.md) | [English](./README.en.md)

Provides APIs for FastGPT to call FastGPT Plugin.

`listPlugins()` now returns a paginated structure:

```ts
type PluginListType = {
  data: PluginListItemType[];
  offset: number;
  limit: number;
  total: number;
};
```

`PluginListItemType` and `PluginSourceType` are also exported so callers can handle the new `source` field and paginated responses.
