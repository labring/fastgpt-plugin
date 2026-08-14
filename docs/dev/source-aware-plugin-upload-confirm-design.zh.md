# Source-aware Plugin Upload/Confirm 设计

## 1. 背景

插件支持多个 source，例如 system、team:{teamId}、debug 或其他下游定义的 source。

插件全局实体由以下 identity 唯一确定：

    pluginId + version + etag

同一个 identity 可以被多个 source 使用，但每个 source 的上传、确认和删除状态必须独立。

当前实现额外维护 pending collection，并在 temp 目录和正式目录之间移动文件。该设计引入了全局 plugin.pending、source pending 记录和文件搬移之间的一致性问题。

## 2. 目标

目标模型：

    plugin
      全局插件实体，按 pluginId + version + etag 复用

    plugin_installations
      source 级插件状态，保存 pending / active 关系

    object storage
      按插件 identity 保存不可变文件，upload 后直接写入正式路径

要求：

1. 不同 source 可以上传和确认相同插件 identity。
2. 同一 source 的状态与其他 source 隔离。
3. 相同 identity 重复上传时复用已有 plugin 和文件，不重复覆盖 plugin 元数据。
4. pending 阶段仍可以访问 icon、README 和其他公开资源。
5. 至少一个 source active 时，plugin.status 才能是 active。
6. confirm、delete 和 runtime 注册具备幂等性和并发安全性。

## 3. 数据模型

### 3.1 plugin

plugin 表表示全局插件实体，不表示某个 source 的安装状态。

    {
      pluginId: 'antvVisualization',
      version: '0.1.0',
      etag: '9abf2d68',
      type: 'tool',
      name: { en: '...', 'zh-CN': '...' },
      icon: 'logo.svg',
      description: { en: '...', 'zh-CN': '...' },
      data: {
        toolDescription: '...',
        inputSchema: '...',
        outputSchema: '...',
        secretSchema: '...',
        children: []
      },
      status: 'active',
      createAt: Date,
      updatedAt: Date
    }

唯一索引：

    { pluginId: 1, version: 1, etag: 1 } // unique

plugin 表不再使用 pending 状态，只保留 active 和 disabled。

### 3.2 plugin_installations

plugin_installations 表表示某个 source 对插件的使用状态。

    {
      source: 'team:team-a',
      pluginId: 'antvVisualization',
      version: '0.1.0',
      etag: '9abf2d68',
      pluginObjectId: ObjectId('...'),
      status: 'pending',
      expiredAt: Date,
      createAt: Date,
      updateAt: Date
    }

唯一索引：

    { source: 1, pluginId: 1, version: 1 } // unique

同一个 source、pluginId、version 只保留一条关系。重新上传其他 etag 时更新这条关系中的 etag 和状态。

状态含义：

    pending
      source 已上传文件，等待确认

    active
      source 已确认使用该版本

    disabled
      source 不再使用该版本，保留关系用于状态审计和幂等删除

新 source 首次上传时创建关系。删除操作可以将关系置为 disabled；后台清理时再删除长期无效的关系。

## 4. 文件存储

插件文件按 immutable identity 存储，不再区分 temp 和正式目录：

    plugin/{pluginId}/{version}/{etag}/index.js
    plugin/{pluginId}/{version}/{etag}/README.md
    plugin/{pluginId}/{version}/{etag}/logo.svg
    plugin/{pluginId}/{version}/{etag}/assets/example.png

upload 阶段直接写入上述路径，pending 阶段也直接返回上述路径对应的可访问 URL。

相同 identity 的不同 source 不会互相覆盖，因为 etag 由 pkg 内容计算，表示同一组文件内容。

### 4.1 相同 identity 的重复上传

当 pluginId、version、etag 完全相同时，重复上传必须复用已有数据：

1. 不重复创建 plugin 实体。
2. 不更新已有 plugin 元数据。
3. 不重复写入 icon、README、assets 和 index 文件。
4. 只确保 source 对应的 installation 关系存在，并刷新 pending 状态。

文件是否已存在可以通过已有 plugin 记录或 identity 文件检查判断。并发上传由唯一索引和幂等写入兜底。

### 4.2 不同 identity

只要 etag 不同，就视为不同插件实体：

    pluginId + version + etag-a
    pluginId + version + etag-b

即使 pluginId 和 version 相同，也分别保存文件和 plugin 实体。确认新 identity 后，再按同 pluginId + version 的 active 版本执行替换逻辑。

## 5. Upload 流程

    1. 下游传入 source 和 pkg 文件
    2. 解包并计算 plugin identity
    3. 解析 manifest，得到相对资源路径
    4. 查询 plugin 表
    5. 如果 identity 已存在，复用原 plugin 和原文件
    6. 如果 identity 不存在，写入文件并创建 plugin，status = disabled
    7. upsert plugin_installations：
       source + pluginId + version
       etag
       pluginObjectId
       status = pending
       expiredAt
    8. 返回插件信息和正式资源 URL

upload 不创建 active installation，也不注册 runtime。

## 6. Confirm 流程

### 6.1 同 identity 已经 active

例如：

    system: active
    team-a: pending

team-a confirm 时：

    1. 校验 team-a installation.status = pending
    2. 将 team-a installation 改为 active
    3. 复用已有 plugin 实体和正式文件
    4. 不重复写文件
    5. 不重复 register runtime
    6. 返回 runtimeRegistrationRequired = false

### 6.2 identity 首次 active

如果 plugin 当前 disabled，且当前 source 是第一个 active source：

    1. 校验 installation.status = pending
    2. 将 installation 改为 active
    3. 查询该 identity 的 active installation 数量
    4. 数量从 0 变为 1 时，将 plugin 改为 active
    5. 执行 runtime register
    6. 返回 runtimeRegistrationRequired = true

### 6.3 并发 confirm

confirm 必须使用条件更新抢占状态：

    updateOne(
      {
        source,
        pluginId,
        version,
        status: 'pending'
      },
      {
        $set: {
          status: 'active',
          updatedAt: new Date()
        },
        $unset: {
          expiredAt: 1
        }
      }
    )

只有成功完成 pending -> active 状态转换的请求可以继续判断 runtime 注册。Mongo transaction 内重新检查 active installation 数量，避免多个请求重复注册同一个 runtime。

## 7. Delete 流程

删除只作用于指定 source：

    1. 在 transaction 中将 source 对应的 installation 置为 disabled
    2. 查询同一 plugin identity 是否还有 active installation
    3. 如果仍有 active source，plugin 保持 active，不 unregister runtime
    4. 如果没有 active source，plugin 改为 disabled，并 unregister runtime

pending installation 删除时也只处理对应 source 的关系，推荐置为 disabled。由于文件是 identity 共享资源，不能直接删除文件。

只有在没有任何 pending 或 active installation 引用该 identity 时，才允许删除 plugin 实体和对象存储文件。disabled installation 不构成文件引用。

## 8. plugin.status 不变量

plugin.status 是全局缓存状态，真实依据是 installation 关系：

    plugin.status = active
      <=> 至少存在一条 status = active 的 installation

    plugin.status = disabled
      <=> 不存在 status = active 的 installation

pending、disabled 或不存在 installation 时，plugin 都必须是 disabled。

以下操作都必须在同一个 Mongo transaction 中同步维护 plugin.status：

- confirm
- delete
- 替换同 pluginId + version 的旧 etag
- 清理过期 pending

delete 将 installation 置为 disabled 后，仍需在同一个 transaction 内重新统计 active installation。

## 9. 元数据和 URL

plugin 元数据中的资源字段建议保存相对路径：

    icon: logo.svg
    readmeUrl: README.md

URL 根据 identity 动态生成：

- upload/pending：正式 identity 路径 URL；
- active：同一个正式 identity 路径 URL。

不保存 source-specific 临时 URL，也不保存签名 URL。

移除 temp 后，pending 和 active 的资源 URL 在对象存储层面相同，区别只存在于 Mongo installation 状态和业务权限。如果需要隐藏未确认资源，应使用私有对象存储或带权限校验的 URL 服务。

## 10. 迁移方案

本方案不做生产数据迁移。

`plugin_pending_installations` 保留模型注册仅用于旧生产数据的 TTL 清理，新 upload、confirm、delete 和 prune 主流程均不再读写该 collection。开发环境遗留数据可直接手动清理。

开发环境中的 plugin_pending_installations、旧 pending plugin 和相关对象存储脏数据由开发者手动清理。

生产环境中已经存在的 pending plugin 作为 legacy 数据处理：

1. 新流程不再读取或写入 plugin.status = pending 作为 source 状态。
2. 新流程不依赖旧 pending 数据完成正常 upload/confirm。
3. 旧 pending plugin 和旧 pending 文件由现有 TTL/定时清理任务处理。
4. 部署前需要确认定时清理覆盖旧 plugin 的 expiredAt、旧 pending 文件和关联 TTL 记录。

生产环境不要求将旧 plugin_pending_installations 转换为新的 installation 记录。

## 11. 测试要求

至少覆盖：

1. system 和 team 上传相同 identity，可以共存。
2. 同一 source 重复上传相同 identity 时，plugin 表数据不变。
3. 同一 source 重复上传相同 identity 时，文件不重复写入。
4. 同一 source 重复上传时，installation pending 状态和过期时间刷新。
5. 不同 etag 创建不同 plugin 实体和文件。
6. pending 阶段 icon、README URL 可访问。
7. active source confirm 不重复写文件和 register runtime。
8. 第一个 active source confirm 只 register 一次。
9. 删除一个 source 不影响其他 source。
10. 删除最后一个 active source 会 disable plugin 并 unregister runtime。
11. pending 过期后，仍被其他 source active 引用的 identity 文件不能被删除。
12. 所有 source installation 都是 disabled 时，plugin.status 为 disabled。
13. 并发 upload、confirm、delete 不产生重复 installation 或错误 plugin.status。

## 12. 结论

最终职责划分：

    plugin
      全局 immutable identity 和共享元数据

    plugin_installations
      source 级 pending / active 状态

    object storage
      按 identity 保存共享文件

    runtime
      只跟随 plugin 全局 active 状态注册和注销

temp 目录、独立 pending collection 和 plugin.status = pending 都可以在新流程发布后移除。生产旧 pending 数据不迁移，按 legacy 清理策略自然消退。
