# 1. 创建或选择应用并获取密钥
在 [飞书开放平台](https://open.feishu.cn/) 登录，进入“开发者后台”。
选择您的应用或者创建一个用于多维表格管理的应用。

# 2. 确保应用权限

参考：https://open.feishu.cn/document/server-docs/docs/bitable-v1/bitable-overview

申请必要的权限，如果需要用到本工具集的所有工具，可以直接全选多维表格相关的权限。

或导入如下的权限

```json
{
  "scopes": {
    "tenant": [
      "base:collaborator:create",
      "base:collaborator:delete",
      "base:collaborator:read",
      "base:dashboard:copy",
      "base:dashboard:read",
      "base:field:create",
      "base:field:delete",
      "base:field:read",
      "base:field:update",
      "base:form:read",
      "base:form:update",
      "base:record:create",
      "base:record:delete",
      "base:record:read",
      "base:record:retrieve",
      "base:record:update",
      "base:role:create",
      "base:role:delete",
      "base:role:read",
      "base:role:update",
      "base:table:create",
      "base:table:delete",
      "base:table:read",
      "base:table:update",
      "base:view:read",
      "base:view:write_only",
      "base:app:copy",
      "base:app:create",
      "base:app:read",
      "base:app:update",
      "bitable:app",
      "bitable:app:readonly"
    ]
  }
}
```

![](./assets/permissions.png)

等企业管理员完成审核后，发布应用，即可使用对应接口。

# 3. 获取应用密钥

按如图所示的方式获取系统密钥。

![](./assets/get-secrets.jpg)
