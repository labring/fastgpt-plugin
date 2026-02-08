# MemMachine 工具集

MemMachine 是一个面向高级 AI 智能体的开源记忆层，使 AI 应用能够学习、存储和回溯历史会话中的数据与偏好，提升后续交互的智能性与个性化体验。

## 密钥获取

1. 访问 [MemMachine 在线平台](https://console.memmachine.ai/) 并注册账号。
2. 登录平台后，前往 [API Keys 页面](https://console.memmachine.ai/api-keys) 获取 API 密钥。
3. 密钥格式为：`mm-xxxxxxxxxxxxx`（以 `mm-` 开头）。

## 功能

### 记忆存储

将关于用户或对话的重要新信息存入记忆。

**主要特性：**

- 存储用户各类信息内容
- 基于已存信息智能总结用户偏好等特征

**参数配置**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| orgId | string | universal | 组织的唯一标识符 |
| projectId | string | universal | 项目的唯一标识符 |
| types | multipleSelect | ['episodic', 'semantic'] | 记忆类型，留空则添加到全部类型 |
| content | string | - | **必填** 要存储的记忆内容 |
| producer | string | user | 记忆内容的发送者 |
| producedFor | string | - | 记忆内容的接收者 |
| timestamp | string | - | 记忆内容的创建时间（ISO 8601格式） |
| role | string | - | 记忆内容在对话中的角色 |
| metadata | string | - | 附加的记忆内容属性（JSON格式） |

**输出格式**
```json
{
  "memoryId": "新的记忆 ID"
}
```

### 记忆搜索

检索用户的相关上下文、记忆或画像信息。

**主要特性：**

- 支持自然语言查询，查找相关记忆内容
- 可跨会话回溯，获取全面的历史信息

**参数配置**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| orgId | string | universal | 组织的唯一标识符 |
| projectId | string | universal | 项目的唯一标识符 |
| types | multipleSelect | ['episodic', 'semantic'] | 记忆类型，留空则搜索全部类型 |
| query | string | - | **必填** 记忆检索的自然语言查询 |
| limit | number | 10 | **必填** 搜索结果数量上限 |
| filter | string | - | 过滤记忆的条件 |
| contextTemplate | string | 默认模板 | 构建记忆上下文的模板 |

**输出格式**
```json
{
  "memoryContext": "记忆上下文"
}
```

## 开发和测试

```bash
# 安装依赖
bun install

# 运行测试
bun run test

# 构建项目
bun run build:runtime
```

## 支持与反馈

如有问题或建议，请通过以下方式联系：

- [GitHub Issues](https://github.com/MemMachine/MemMachine/issues)
- [MemMachine 文档](https://docs.memmachine.ai/)
