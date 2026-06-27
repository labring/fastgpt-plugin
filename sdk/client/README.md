# FastGPT-plugin SDK client

语言：[简体中文](./README.md) | [English](./README.en.md)

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

`getPluginServiceFeatures()` 可查询当前 Plugin 服务已启用的能力：

```ts
const features = await client.getPluginServiceFeatures();
// { remoteDebug: boolean }
```
