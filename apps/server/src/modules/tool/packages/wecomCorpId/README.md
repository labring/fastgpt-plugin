# 企业微信授权工具 (WeChat Work Auth Tool)

## 简介

此工具用于获取企业微信（WeChat Work）的授权 Token，支持在 FastGPT 工作流中使用。

⚠️注意：仅支持企微注册的账号/团队使用。

## 功能

- 通过企业 ID（corpId）获取企业微信访问令牌
- 返回 access_token 和过期时间
- 使用 FastGPT 反向调用框架实现

## 输入参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| corpId | string | 是 | 企业微信的企业 ID |

## 输出参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| access_token | string | 企业微信访问令牌 |
| expires_in | number | Token 过期时间（秒） |

## 使用示例

### 在工作流中使用

1. 添加"企业微信授权"工具节点
2. 输入企业 ID（corpId）
3. 获取返回的 access_token 和 expires_in
4. 将 access_token 传递给后续需要调用企业微信 API 的节点

### 示例配置

```json
{
  "corpId": "ww1234567890abcdef"
}
```

### 示例输出

```json
{
  "access_token": "abc123xyz456token",
  "expires_in": 7200
}
```

## 技术实现

此工具使用 FastGPT 的反向调用框架（invoke framework）：

```typescript
import { invoke } from '@/invoke';

const result = await invoke('wecom.getAuthToken', {
  corpId: 'your_corp_id'
});
```

## 注意事项

- access_token 有效期通常为 7200 秒（2 小时）
- 请妥善保管 access_token，避免泄露
- 建议在 token 过期前提前刷新

## 版本历史

### 0.1.0
- 初始版本
- 支持获取企业微信授权 Token
