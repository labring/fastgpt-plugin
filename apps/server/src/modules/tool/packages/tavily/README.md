# Tavily 工具集

Tavily 是一个专门为 AI 应用程序设计的智能搜索 API，提供高质量的搜索结果和内容提取功能。

## 密钥获取

1. 访问 [Tavily 官网](https://tavily.com) 注册账户
2. 登录后在 [控制台](https://app.tavily.com) 获取 API 密钥
3. API 密钥格式：`tvly-xxxxxxxxxxxxx`（以 `tvly-` 开头）

## 功能

### 📊 AI 搜索 (AI Search)

使用 AI 驱动的智能网络搜索，提供相关性排序的搜索结果和可选的 AI 生成摘要。

**主要特性：**
- 智能相关性排序和结果过滤
- 支持 AI 生成答案摘要
- 基础搜索（1 credit）和高级搜索（2 credits）两种模式
- 可定制返回结果数量（1-20 个）
- 60 秒超时保护

**使用场景：**
- 实时信息检索
- 研究资料收集
- 新闻和资讯搜索
- 技术文档查找

### 📝 内容提取 (Content Extract)

从网页中提取结构化的内容，支持 Markdown 和文本格式输出。

**主要特性：**
- 支持批量 URL 处理
- 自动清理和格式化内容
- 提取页面中的图片链接
- 支持换行分隔的多 URL 输入
- 错误处理和失败报告

**使用场景：**
- 网页内容抓取
- 文章采集和处理
- 数据清洗和整理
- 内容聚合和分析

### 🕷️ 网站爬取 (Web Crawler)

基于图的并行网站爬取功能，深度探索网站内容结构。

**主要特性：**
- 智能图遍历算法，支持并行爬取
- 可配置爬取深度和广度限制
- 自然语言指令指导爬取方向
- 路径选择和排除规则（正则表达式）
- 支持基础和高级内容提取
- 可控制外部链接处理策略
- 图片和 favicon 包含选项
- 10-150秒可调超时时间

**使用场景：**
- 完整网站文档抓取
- API 文档结构化采集
- 站点地图生成
- 内容聚合平台
- 竞品分析
- SEO 优化研究
- 知识库构建

### 🗺️ 网站地图 (Site Map)

智能网站结构映射工具，快速发现和整理网站的所有可访问链接。

**主要特性：**
- 图遍历算法，并行探索网站结构
- 智能链接发现和分类
- 路径和域名过滤（正则表达式）
- 深度和广度控制
- 外部链接包含/排除选项
- 指令引导映射（自然语言）
- 10-150秒可调超时时间

**使用场景：**
- 网站结构分析
- 站点地图生成
- 爬取计划制定
- SEO 网站审计
- 链接完整性检查
- 内容架构分析
- 网站迁移规划

## 配置参数

### AI 搜索参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| query | string | - | **必填** 搜索查询内容 |
| searchDepth | select | basic | 搜索深度：basic（基础）或 advanced（高级） |
| maxResults | number | 10 | 最大返回结果数（1-20） |
| includeAnswer | boolean | false | 是否生成 AI 摘要答案 |

### 内容提取参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| urls | string | - | **必填** URL 地址，支持多个（换行分隔） |
| format | select | markdown | 输出格式：markdown 或 text |

### 网站爬取参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| url | string | - | **必填** 起始爬取的根 URL |
| instructions | string | - | 自然语言爬取指令（使用会增加成本） |
| maxDepth | number | 1 | 爬取最大深度（1-5） |
| maxBreadth | number | 20 | 每层跟随的最大链接数 |
| limit | number | 50 | 处理的总链接数上限 |
| selectPaths | string | - | 包含路径的正则表达式（每行一个） |
| excludePaths | string | - | 排除路径的正则表达式（每行一个） |
| allowExternal | boolean | true | 是否包含外部域链接 |
| includeImages | boolean | false | 是否在结果中包含图片 |
| extractDepth | select | basic | 提取深度：basic 或 advanced |
| format | select | markdown | 内容输出格式：markdown 或 text |
| includeFavicon | boolean | false | 是否为每个结果包含 favicon URL |
| timeout | number | 150 | 超时时间（10-150秒） |

### 网站地图参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| url | string | - | **必填** 起始映射的根 URL |
| instructions | string | - | 自然语言映射指令（使用会增加成本） |
| maxDepth | number | 1 | 映射最大深度（1-5） |
| maxBreadth | number | 20 | 每层跟随的最大链接数 |
| limit | number | 50 | 处理的总链接数上限 |
| selectPaths | string | - | 包含路径的正则表达式（每行一个） |
| selectDomains | string | - | 包含域名的正则表达式（每行一个） |
| excludePaths | string | - | 排除路径的正则表达式（每行一个） |
| excludeDomains | string | - | 排除域名的正则表达式（每行一个） |
| allowExternal | boolean | true | 是否包含外部域链接 |
| timeout | number | 150 | 超时时间（10-150秒） |

## 输出格式

### AI 搜索输出

```json
{
  "answer": "AI 生成的答案摘要（可选）",
  "results": [
    {
      "title": "网页标题",
      "url": "网页链接",
      "content": "网页内容摘要",
      "raw_content": "完整原始内容（高级搜索）"
    }
  ]
}
```

### 内容提取输出

```json
{
  "results": [
    {
      "url": "提取的 URL",
      "raw_content": "提取的内容",
      "images": ["图片链接数组"]
    }
  ],
  "successCount": 3,
  "failedUrls": ["失败的 URL 及原因"]
}
```

### 网站爬取输出

```json
{
  "baseUrl": "被爬取的基础 URL",
  "results": [
    {
      "url": "爬取的页面 URL",
      "raw_content": "页面内容",
      "favicon": "favicon URL（可选）"
    }
  ],
  "successCount": 25,
  "responseTime": 45.67
}
```

### 网站地图输出

```json
{
  "baseUrl": "被映射的基础 URL",
  "results": [
    "https://example.com/page1",
    "https://example.com/page2",
    "https://example.com/docs/api"
  ],
  "urlCount": 150,
  "responseTime": 12.34
}
```

## 使用示例

### 基础搜索
```typescript
// 搜索 TypeScript 相关内容
{
  "query": "TypeScript 最新特性",
  "searchDepth": "basic",
  "maxResults": 5,
  "includeAnswer": false
}
```

### AI 摘要搜索
```typescript
// 获取 AI 生成的摘要答案
{
  "query": "什么是量子计算？",
  "searchDepth": "advanced",
  "maxResults": 8,
  "includeAnswer": true
}
```

### 内容提取
```typescript
// 提取单个网页内容
{
  "urls": "https://example.com/article",
  "format": "markdown"
}
```

### 批量内容提取
```typescript
// 提取多个网页内容
{
  "urls": "https://site1.com/article\nhttps://site2.com/news\nhttps://site3.com/docs",
  "format": "text"
}
```

### 基础网站爬取
```typescript
// 深度爬取网站文档
{
  "url": "docs.tavily.com",
  "maxDepth": 2,
  "maxBreadth": 15,
  "limit": 50,
  "includeFavicon": true
}
```

### 指令引导爬取
```typescript
// 使用自然语言指令指导爬取
{
  "url": "docs.tavily.com",
  "instructions": "Find all pages about the Python SDK",
  "maxDepth": 3,
  "limit": 30,
  "extractDepth": "advanced"
}
```

### 路径过滤爬取
```typescript
// 使用正则表达式过滤爬取路径
{
  "url": "example.com",
  "selectPaths": "/docs/.*\n/api/v1.*",
  "excludePaths": "/private/.*\n/admin/.*",
  "maxDepth": 2
}
```

### 大规模爬取
```typescript
// 配置大规模深度爬取
{
  "url": "large-site.com",
  "maxDepth": 5,
  "maxBreadth": 30,
  "limit": 200,
  "allowExternal": false,
  "includeImages": true,
  "timeout": 300
}
```

### 基础网站映射
```typescript
// 映射网站结构
{
  "url": "docs.tavily.com",
  "maxDepth": 2,
  "maxBreadth": 15,
  "limit": 50,
  "allowExternal": true
}
```

### 指令引导映射
```typescript
// 使用自然语言指令映射
{
  "url": "docs.tavily.com",
  "instructions": "Find all API documentation pages",
  "maxDepth": 3,
  "limit": 100
}
```

### 路径过滤映射
```typescript
// 使用正则表达式过滤映射
{
  "url": "example.com",
  "selectPaths": "/docs/.*\n/api/.*",
  "excludePaths": "/private/.*",
  "selectDomains": "^example\\.com$",
  "maxDepth": 2
}
```

## 错误处理

工具提供完善的错误处理机制：

- **认证错误**：API 密钥无效或过期
- **速率限制**：请求频率超限，需要等待
- **网络错误**：连接超时或网络不可达
- **服务器错误**：Tavily 服务端错误
- **请求错误**：参数格式不正确

## API 限制

### AI 搜索
- 请求超时：60 秒
- 搜索结果数：1-20 个
- 速率限制：根据订阅计划不同而有所限制

### 内容提取
- 请求超时：60 秒
- 批量提取：支持多个 URL（换行分隔）
- 基础提取：1 credit / 5 次成功提取
- 高级提取：2 credits / 5 次成功提取

### 网站爬取
- 请求超时：10-150 秒（可配置）
- 爬取深度：1-5 层
- 最大链接数：可自定义限制
- 基础提取：1 credit / 5 页成功爬取
- 高级提取：2 credits / 5 页成功爬取
- 指令引导：2 credits / 10 页成功爬取
- 速率限制：根据订阅计划不同而有所限制

**注意：** 爬取操作消耗更多资源，建议合理设置限制参数。

### 网站地图
- 请求超时：10-150 秒（可配置）
- 映射深度：1-5 层
- 最大链接数：可自定义限制
- 基础映射：1 credit / 10 页成功映射
- 指令引导：2 credits / 10 页成功映射
- 速率限制：根据订阅计划不同而有所限制

**注意：** 映射操作比搜索消耗更多资源，但比爬取操作轻量。

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
- GitHub Issues
- FastGPT 社区
- Tavily 官方文档：https://docs.tavily.com
