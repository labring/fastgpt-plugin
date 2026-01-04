# MemMachine 系统工具

## 参考信息

本工具集用于处理 MemMachine 相关操作。

### 参考文档

- [MemMachine 文档](https://docs.memmachine.ai/)
- [MemMachine API 文档](https://api.memmachine.ai/docs)

### 测试密钥环境变量名

无需环境变量配置

密钥获取链接：https://console.memmachine.ai/

### 工具集/子工具列表

一个MemMachine工具集，包含以下工具：

#### 1. 存储记忆（store）
- **功能**：将用户的记忆内容通过 MemMachine API 存储到 MemMachine 服务端。
- **API**：`POST {baseUrl}/memories`
- **输入**：组织 ID, 项目 ID, 记忆类型, 记忆消息, 消息发送者, 消息接收者, 消息创建时间, 消息角色, 附加属性
- **输出**：新的记忆 ID

#### 2. 搜索记忆（search）
- **功能**：根据关键词，通过 MemMachine API 检索已存储的记忆内容。
- **API**：`POST {baseUrl}/memories/search`
- **输入**：组织 ID, 项目 ID, 记忆类型, 搜索内容，最大返回数量，过滤条件，上下文模板
- **输出**：记忆上下文
