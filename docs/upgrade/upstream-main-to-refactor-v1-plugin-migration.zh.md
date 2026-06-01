# 从 upstream/main 升级到 refactor/v1.0.0

创建时间：2026-06-01 12:05:14 CST

适用范围：从 `upstream/main` 升级到当前 `refactor/v1.0.0` 分支。

本次升级主要迁移系统工具插件基础设施。模型配置和 workflow 模板保持兼容，升级时不用做专项迁移。

## 结论

- 旧版内置系统工具目录 `modules/tool/packages` 已移除，系统工具改为通过插件包 `.pkg` 或插件集合 `.zip` 上传、确认、安装和运行。
- `system_plugins` collection 被新版继续使用，但文档结构已经变更。旧版 `{ type: 'tool', toolId, objectName? }` 记录不能被新版直接读取为可运行插件。
- 新增 `plugin_installations` 和 `plugin_runtime_configs` 两个 collection。`s3_ttls` collection 保持同名同结构。
- 推荐迁移方式是备份后清理旧 `system_plugins` 记录，再用官方插件 `.zip` 包重新导入系统工具。
- 不建议写旧工具记录到新插件记录的自动转换脚本，因为旧记录缺少新版需要的 `pluginId`、`version`、`etag`、manifest、运行入口和资源文件布局。

## 代码结构变化

旧版结构：

- `runtime/*`：服务入口和运行时。
- `lib/*`：Mongo、Redis、S3、缓存、worker 等基础设施。
- `modules/tool/*`：系统工具列表、上传、安装、运行、内置工具源码。
- `modules/model/*`、`modules/workflow/*`：模型和 workflow 静态数据。
- `sdk/*`：旧客户端 SDK。

新版结构：

- `apps/server/*`：HTTP 服务入口、路由组装和启动初始化。
- `packages/domain/*`：实体、值对象和端口定义。
- `packages/usecase/*`：插件、工具、模型、runtime 的应用用例。
- `packages/interface-adapter/*`：API contract、DTO、controller。
- `packages/infrastructure/*`：Mongo、S3、Redis、本地文件、插件仓储、运行时驱动和静态数据。
- `sdk/client/*`：新版调用端 SDK。
- `sdk/factory/*`：系统工具开发 SDK。
- `apps/cli/*`：系统工具创建、构建、检查、打包 CLI。

## 系统工具迁移

旧版系统工具的安装链路是：

1. 工具源码放在 `modules/tool/packages`。
2. 打包后上传到私有对象存储路径。
3. Mongo `system_plugins` 只保存 `{ type: 'tool', toolId }`。
4. 服务启动时读取 `system_plugins`，从对象存储下载 `${toolId}.js` 并注册到缓存。

新版系统工具的安装链路是：

1. 工具由 `@fastgpt-plugin/sdk-factory` 定义 manifest、输入输出、密钥和 handler。
2. `@fastgpt-plugin/cli` 构建为 `dist/index.js`、`dist/manifest.json` 和资源文件，再打包为 `.pkg`。
3. 服务支持上传单个 `.pkg` 或包含多个 `.pkg` 的 `.zip`。
4. 上传接口先写入 pending 插件和临时对象存储路径。
5. 确认接口将 pending 插件转为 active，写入 `plugin_installations`，并注册到运行时。
6. 服务启动时读取 active 插件并注册到 local-pool 运行时。

用户升级时按以下流程处理系统工具：

1. 停止旧版插件服务。
2. 备份 MongoDB 和对象存储中的旧系统工具数据。
3. 清理旧 `system_plugins` 文档，避免旧结构影响新版索引和列表查询。
4. 部署新版服务。
5. 通过 `/api/plugin/upload` 上传官方插件 `.zip` 包。
6. 读取上传响应中的 `plugins[].pluginId/version/etag`，调用 `/api/plugin/confirm` 确认。
7. 验证 `/api/tools`、`/api/plugin/versions` 和实际工具运行。

你会单独提供当前所有官方插件的 `.zip` 压缩包，升级文档中只需要要求用户使用该 zip，不需要在仓库内维护该文件。

## 数据库变化

### `system_plugins`

旧版字段：

```js
{
  type: 'tool',
  toolId: 'getTime',
  objectName: 'deprecated optional value'
}
```

旧版唯一索引：

```js
{ type: 1, toolId: 1 }
```

新版字段：

```js
{
  pluginId: 'getTime',
  version: '1.0.0',
  etag: 'content-etag',
  type: 'tool',
  author: 'optional author',
  name: { en: 'Get Time', 'zh-CN': '获取时间' },
  icon: 'https://...',
  tutorialUrl: 'optional url',
  readmeUrl: 'optional url',
  description: { en: '...', 'zh-CN': '...' },
  tags: ['tools'],
  versionDescription: { en: '...', 'zh-CN': '...' },
  repoUrl: 'optional url',
  permission: [],
  data: {
    toolDescription: '...',
    inputSchema: {},
    outputSchema: {},
    secretSchema: {},
    children: []
  },
  status: 'active',
  expiredAt: undefined,
  createAt: Date,
  updateAt: Date
}
```

新版索引：

```js
{ pluginId: 1, version: 1, etag: 1 } // unique
{ expiredAt: 1 } // TTL, expireAfterSeconds: 0
```

迁移判断：

- 需要数据处理。
- 处理方式推荐为清理旧结构记录，再重新导入官方插件 zip。
- 如果旧 `system_plugins` 记录保留，运行时列表和注册无法得到完整插件数据；开启 `SYNC_INDEX=true` 时还可能因为旧记录缺少新版唯一索引字段而导致索引同步失败。

### `plugin_installations`

新版新增 collection，用来表示某个来源已安装哪个插件版本。

字段：

```js
{
  source: 'system',
  pluginId: 'getTime',
  version: '1.0.0',
  etag: 'content-etag',
  pluginObjectId: ObjectId('...')
}
```

索引：

```js
{ source: 1, pluginId: 1, version: 1 } // unique
```

迁移判断：

- 需要由新版安装/确认流程自动生成。
- 不建议手工补写，避免 `pluginObjectId` 与 `system_plugins` 中实际插件记录不一致。

### `plugin_runtime_configs`

新版新增 collection，用来保存插件运行时配置。

字段：

```js
{
  pluginId: 'getTime',
  config: {},
  updatedAt: Date
}
```

索引：

```js
{ pluginId: 1, version: 1, etag: 1 } // unique
{ pluginId: 1 }
```

迁移判断：

- 无旧数据需要迁移。
- 不存在记录时会使用默认 local-pool 配置。
- 如需按插件调优进程池参数，升级后通过 runtime config 接口写入。

### `s3_ttls`

旧版和新版字段一致：

```js
{
  bucketName: 'fastgpt-private',
  minioKey: '...',
  expiredTime: Date
}
```

索引一致：

```js
{ expiredTime: 1 }
{ bucketName: 1, minioKey: 1 }
```

迁移判断：

- 不需要迁移脚本。
- 可以保留旧数据。旧 pending 文件过期记录自然失效，清理旧系统工具时可以按对象存储路径做额外清理。

## Mongo 迁移操作

升级前先备份数据库：

```bash
mongodump --uri "$MONGODB_URI" --archive=fastgpt-plugin-before-refactor-v1.archive
```

检查旧结构记录数量：

```js
db.system_plugins.countDocuments({
  type: 'tool',
  toolId: { $exists: true },
  pluginId: { $exists: false }
})
```

推荐清理旧结构记录：

```js
db.system_plugins.deleteMany({
  type: 'tool',
  toolId: { $exists: true },
  pluginId: { $exists: false }
})
```

如果 `SYNC_INDEX=true` 且旧索引还存在，可以在清理旧记录后删除旧唯一索引，让新版服务重新同步索引：

```js
db.system_plugins.dropIndex('type_1_toolId_1')
```

索引名以实际环境为准，可以先执行：

```js
db.system_plugins.getIndexes()
```

部署新版并导入官方插件 zip 后，验证新结构：

```js
db.system_plugins.countDocuments({ pluginId: { $exists: true }, status: 'active' })
db.plugin_installations.countDocuments({ source: 'system' })
db.plugin_runtime_configs.countDocuments()
db.s3_ttls.getIndexes()
```

`plugin_runtime_configs` 可以为 0，这是正常状态。

## 官方插件 zip 导入

假设新版服务地址为 `http://localhost:3000`，鉴权 token 在 `AUTH_TOKEN` 中。

上传官方插件 zip：

```bash
curl -X POST "$FASTGPT_PLUGIN_BASE_URL/api/plugin/upload" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "files=@official-system-plugins.zip"
```

上传成功会返回类似：

```json
{
  "data": {
    "plugins": [
      {
        "pluginId": "getTime",
        "version": "1.0.0",
        "etag": "..."
      }
    ]
  }
}
```

确认上传结果：

```bash
curl -X POST "$FASTGPT_PLUGIN_BASE_URL/api/plugin/confirm" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "uniqueIds": [
      {
        "pluginId": "getTime",
        "version": "1.0.0",
        "etag": "..."
      }
    ]
  }'
```

如果 zip 内包含多个插件，需要把上传响应中所有 `plugins` 的 `pluginId/version/etag` 都放进 `uniqueIds`。

也可以通过 URL 安装：

```bash
curl -X POST "$FASTGPT_PLUGIN_BASE_URL/api/plugin/install" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://example.com/official-system-plugins.zip"]
  }'
```

URL 安装适合已经把 zip 放在服务可访问的公网或白名单域名。生产环境建议保持 `DISABLE_SSRF_CHECK=false`，必要时通过 `ALLOWED_INSTALL_HOSTS` 配置允许域名。

## 配置变更

服务入口从旧 `runtime` 迁移到 `apps/server`，Docker 镜像运行命令也改为：

```bash
node dist/main.js
```

构建工具从 Bun 迁移到 Node 22 + pnpm workspace。镜像构建会执行 `pnpm --filter @fastgpt-plugin/server build`。

新增或需要关注的环境变量：

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `AUTH_TOKEN` | API 鉴权 token。生产环境必须设置强 token。 | development 下为 `token` |
| `DISABLE_SSRF_CHECK` | 是否关闭插件安装 URL 安全检查。生产环境建议保持 `false`。 | `false` |
| `ALLOWED_INSTALL_HOSTS` | 插件 URL 安装允许的远程主机，逗号分隔。 | 空 |
| `PLUGIN_RUNTIME_MODE` | 插件运行时模式。当前默认 local-pool。 | `localPool` |
| `LOCAL_FILE_BASE_PATH` | 插件运行本地缓存目录。 | 系统 tmp 下 `fastgpt-plugin` |
| `S3_FILE_BASE_PATH` | 新版对象存储基础路径。 | `system/plugin` |
| `POOL_MAX_TOTAL_PODS` | local-pool 全局最大进程数。 | `100` |
| `POOL_SERVICE_MIN_PODS` | 每个插件默认最小进程数。 | `0` |
| `POOL_SERVICE_MAX_PODS` | 每个插件默认最大进程数。 | `5` |
| `POOL_SERVICE_IDLE_TIMEOUT` | 空闲进程回收时间，毫秒。 | `60000` |
| `POOL_SERVICE_POD_TIMEOUT` | 插件进程执行超时，毫秒。 | `120000` |
| `POOL_SERVICE_STARTUP_RETRY_BASE_DELAY` | 插件启动失败重试基础退避，毫秒。 | `1000` |
| `POOL_SERVICE_STARTUP_RETRY_MAX_DELAY` | 插件启动失败重试最大退避，毫秒。 | `10000` |

被替换或移除的配置：

- `CHECK_INTERNAL_IP` 被插件安装 URL 的 SSRF 检查配置替代。
- `DISABLE_DEV_TOOLS` 对新版生产迁移没有实际作用，系统工具不再从 `modules/tool/packages` 开发目录加载。
- `MODEL_CHANNEL_PRIORITY` 在环境 schema 中仍保留，但 `.env.template` 已不再强调；模型兼容升级时无需专项处理。

## 对象存储变化

旧版系统工具主要使用 `system/plugin/tools/<toolId>.js` 保存私有运行入口，并使用 `system/plugin/files` 下的公共资源路径。

新版插件文件按唯一版本组织：

```text
system/plugin/<pluginId>/<version>/<etag>/index.js
system/plugin/<pluginId>/<version>/<etag>/README.md
system/plugin/<pluginId>/<version>/<etag>/<logo-file>
system/plugin/<pluginId>/<version>/<etag>/assets/<asset-file>
system/plugin/temp/<pluginId>/<version>/<etag>/...
```

迁移判断：

- 旧对象存储文件不用转换。
- 导入官方插件 zip 后会写入新版路径。
- 确认新插件可运行后，可以按备份策略清理旧系统工具对象路径。

## 验证清单

升级后执行：

```bash
curl "$FASTGPT_PLUGIN_BASE_URL/health"
```

验证工具列表：

```bash
curl "$FASTGPT_PLUGIN_BASE_URL/api/tools" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

验证单个工具详情：

```bash
curl "$FASTGPT_PLUGIN_BASE_URL/api/tool?pluginId=getTime&fallbackLatestVersion=true" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

验证 Mongo 记录：

```js
db.system_plugins.findOne({ pluginId: 'getTime' })
db.plugin_installations.findOne({ source: 'system', pluginId: 'getTime' })
```

验证服务日志：

- 启动阶段出现 `Register active plugins on init completed`。
- 导入阶段没有 `Failed to create plugin in MongoDB`。
- 运行阶段没有 `Failed to register active plugin`。

## 回滚建议

1. 停止新版服务。
2. 恢复升级前 Mongo 备份。
3. 恢复旧镜像和旧对象存储路径。
4. 重新启动旧版服务。

已经导入到新版路径的对象存储文件可以保留到确认回滚稳定后再清理。

## 需要同步给用户的信息

- 升级前必须备份 MongoDB 和对象存储。
- 首次启动新版前建议清理旧 `system_plugins` 结构记录。
- 官方系统工具需要通过你提供的 zip 包重新导入。
- 模型和 workflow 无需迁移脚本。
- 旧系统工具记录没有自动转换脚本；这是有意设计，目的是避免生成缺少 manifest 和版本信息的不完整插件。
