# YouTube 字幕获取工具

获取 YouTube 视频的字幕内容,支持多种语言。

## 功能特点

- 支持通过视频 URL 或视频 ID 获取字幕
- 支持多种 YouTube URL 格式
- 自动提取和格式化字幕文本
- 返回可用语言列表
- 错误处理和友好的错误提示

## 输入参数

### videoUrl (必填)
- 类型: `string`
- 描述: YouTube 视频链接或视频 ID
- 支持格式:
  - 完整链接: `https://www.youtube.com/watch?v=VIDEO_ID`
  - 短链接: `https://youtu.be/VIDEO_ID`
  - 嵌入链接: `https://www.youtube.com/embed/VIDEO_ID`
  - 直接视频 ID: `VIDEO_ID`

示例:
```
https://www.youtube.com/watch?v=s3iM7VslPsQ
https://youtu.be/s3iM7VslPsQ
s3iM7VslPsQ
```

### lang (可选)
- 类型: `string`
- 默认值: `zh-CN`
- 描述: 字幕语言代码
- 常用语言代码:
  - `en` - 英语
  - `zh-CN` - 简体中文
  - `zh-TW` - 繁体中文
  - `ja` - 日语
  - `ko` - 韩语
  - `es` - 西班牙语
  - `fr` - 法语
  - `de` - 德语
  - `ru` - 俄语
  - `ar` - 阿拉伯语

## 输出结果

### subtitle
- 类型: `string`
- 描述: 格式化后的字幕文本内容,每行一句

### videoId
- 类型: `string`
- 描述: YouTube 视频的唯一标识符

### availableLanguages
- 类型: `string[]`
- 描述: 该视频可用的字幕语言列表

## 使用示例

### 示例 1: 获取英文字幕

**输入:**
```json
{
  "videoUrl": "https://www.youtube.com/watch?v=s3iM7VslPsQ",
  "lang": "en"
}
```

**输出:**
```json
{
  "subtitle": "Welcome to this video\nToday we'll discuss...\n...",
  "videoId": "s3iM7VslPsQ",
  "availableLanguages": ["en", "zh-CN", "ja", "ko"]
}
```

### 示例 2: 获取中文字幕

**输入:**
```json
{
  "videoUrl": "s3iM7VslPsQ",
  "lang": "zh-CN"
}
```

**输出:**
```json
{
  "subtitle": "欢迎观看此视频\n今天我们将讨论...\n...",
  "videoId": "s3iM7VslPsQ",
  "availableLanguages": ["en", "zh-CN", "ja", "ko"]
}
```

## 错误处理

工具会在以下情况下返回错误:

1. **无效的视频 URL 或 ID**
   - 错误信息: "无法从输入中提取视频 ID。请提供有效的 YouTube 链接或视频 ID。"

2. **指定语言的字幕不可用**
   - 错误信息: "无法获取 {lang} 语言的字幕。该视频可能没有该语言的字幕,或者字幕不可用。"

3. **字幕内容为空**
   - 错误信息: "字幕内容为空"

4. **其他错误**
   - 错误信息: "获取 YouTube 字幕失败: {具体错误信息}"

## 注意事项

1. 该工具仅能获取公开视频的字幕
2. 视频必须有可用的字幕(自动生成或手动上传)
3. 某些受限视频可能无法获取字幕
4. 获取可用语言列表可能需要额外时间

## 技术实现

- 使用 `youtube-caption-extractor` 库获取字幕
- 自动去除 HTML 标签并格式化文本
- 支持多种 YouTube URL 格式的自动解析
- 并行获取可用语言列表以提高性能(最多检查 5 种常见语言)
- Zod 类型验证确保输入输出的类型安全

## 性能优化

- 可用语言列表检测采用并行请求,避免串行等待
- 限制并行请求数量为 5 个,避免过载
- 优先返回已成功获取的语言,其他语言异步检测

## 版本历史

### v0.1.0
- 初始版本
- 支持基本的字幕获取功能
- 支持多种 URL 格式
- 支持多语言字幕
