# FastGPT-plugin SDK client

提供接口供 FastGPT 调用。

`listPlugins()` 现在返回分页结构：

```ts
type PluginListType = {
  data: PluginListItemType[];
  offset: number;
  limit: number;
  total: number;
};
```

同时导出了 `PluginListItemType` 和 `PluginSourceType`，方便调用方处理新的 `source` / 分页返回。
