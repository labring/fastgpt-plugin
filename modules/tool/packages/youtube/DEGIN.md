# YouTube 系统工具集

## 参考信息

本工具集用于处理 YouTube 视频相关操作。

### 参考文档

- YouTube Caption Extractor: https://www.npmjs.com/package/youtube-caption-extractor
- YouTube API 文档: https://developers.google.com/youtube/v3

### 测试密钥环境变量名

无需环境变量配置 (使用公开 API)

测试链接：
1. https://www.youtube.com/watch?v=s3iM7VslPsQ

### 工具集/子工具列表

一个 YouTube 工具集，包含以下工具：

#### 1. getSubtitle - YouTube 字幕获取

**功能**: 获取 YouTube 视频的字幕内容,支持多种语言

**输入参数**:
- `videoUrl` (必填): YouTube 视频链接或视频 ID
  - 支持格式: 完整链接、短链接、嵌入链接、直接视频 ID
- `lang` (可选): 字幕语言代码 (默认: en)
  - 常用: en, zh-CN, zh-TW, ja, ko, es, fr, de, ru, ar

**输出结果**:
- `subtitle`: 格式化后的字幕文本内容
- `videoId`: YouTube 视频 ID
- `availableLanguages`: 可用字幕语言列表

**实现方案**:
- 使用 `youtube-caption-extractor` npm 包
- 自动解析多种 YouTube URL 格式
- 去除 HTML 标签并格式化字幕文本
- 异步获取可用语言列表

**错误处理**:
- 无效视频 URL/ID 检测
- 字幕不可用时的友好提示
- 指定语言不存在时的错误信息

详细文档: [children/getSubtitle/README.md](./children/getSubtitle/README.md)

## 实现状态

- [x] 工具集基础结构
- [x] getSubtitle 工具实现
- [x] 类型定义和验证
- [x] 错误处理
- [x] 文档编写
- [x] Logo 设计

## 技术栈

- TypeScript
- Bun Runtime
- Zod (类型验证)
- youtube-caption-extractor (字幕提取)

## 版本

- 当前版本: v0.1.0
- 工具类型: entertainment (娱乐)

