# publishDraft 工具使用说明

## 功能描述

`publishDraft` 工具用于发布已创建的微信公众号草稿到公众号，支持将草稿内容发布为正式的文章。

## 使用场景

1. **内容发布工作流**：配合 `uploadMarkdownToDraft` 工具使用，先创建草稿再发布
2. **批量内容管理**：批量处理草稿并在适当时机发布
3. **自动化内容发布**：集成到自动化系统中定时发布内容

## 参数说明

### 认证参数（二选一）

1. **accessToken**（推荐）：直接提供微信公众号访问令牌
2. **appId + appSecret**：通过应用ID和密钥自动获取访问令牌

### 发布参数

- **mediaId**：要发布的草稿的 media_id（从创建草稿获得）

## 使用示例

### 方式一：使用 access_token 直接发布

```typescript
{
  "accessToken": "your_access_token_here",
  "mediaId": "MEDIA_ID_123456789"
}
```

### 方式二：使用 app_id 和 app_secret

```typescript
{
  "appId": "your_wechat_appid",
  "appSecret": "your_wechat_appsecret",
  "mediaId": "MEDIA_ID_123456789"
}
```

## 完整工作流示例

### 1. 上传 Markdown 并创建草稿

```javascript
// 使用 uploadMarkdownToDraft 工具
const draftResult = await uploadMarkdownToDraft({
  accessToken: "your_access_token",
  markdownContent: "# 我的文章\n\n这是文章内容...",
  coverImage: "https://example.com/cover.jpg",
  title: "我的新文章",
  author: "作者名"
});

// 草稿创建成功，返回 media_id
const mediaId = draftResult.media_id;
```

### 2. 发布草稿

```javascript
// 使用 publishDraft 工具
const publishResult = await publishDraft({
  accessToken: "your_access_token",
  mediaId: mediaId  // 使用上一步获得的 media_id
});

// 发布成功，返回发布任务ID
console.log("发布任务ID:", publishResult.publishId);
console.log("消息数据ID:", publishResult.msgDataId);
```

## 返回结果

### 成功响应

```json
{
  "publishId": "PUBLISH_ID_123456789",
  "msgDataId": "MSG_DATA_ID_123456789"
}
```

- **publishId**：发布任务ID，可用于查询发布状态
- **msgDataId**：消息数据ID，用于标识发布的消息

### 错误响应

```json
{
  "error_message": "发布草稿失败: 具体错误信息"
}
```

## 常见错误及处理

1. **media_id 不存在**：确保草稿已成功创建且未被删除
2. **access_token 过期**：更新 access_token 或使用 appId/appSecret 自动获取
3. **草稿内容违规**：检查草稿内容是否符合微信公众号规范
4. **发布频率限制**：注意微信公众号的发布频率限制

## 相关工具

- **uploadMarkdownToDraft**：创建草稿工具，常与此工具配合使用
- **uploadPermanentMaterial**：上传永久素材，用于获取封面图片的 media_id

## API 文档

- [微信公众号发布接口文档](https://developers.weixin.qq.com/doc/subscription/api/public/api_freepublish_submit.html)
- [微信公众号发布状态查询](https://developers.weixin.qq.com/doc/subscription/api/public/api_freepublish_get.html)
