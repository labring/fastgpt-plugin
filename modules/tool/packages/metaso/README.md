# Metaso Plugin for FastGPT

Metaso 插件为 FastGPT 提供了强大的网络搜索、智能问答和网页内容读取功能，基于 Metaso API 构建。

## 功能特性

### 🔍 metasoSearch - 智能搜索
- **多范围搜索**：支持全网、网页、学术、新闻等不同搜索范围
- **智能摘要**：可选择是否包含搜索结果摘要
- **结果数量控制**：灵活设置返回结果数量（1-20条）
- **工作流集成**：支持 reference 参数，便于工作流中传递搜索关键词

### 💬 metasoAsk - 智能问答
- **自然语言问答**：支持复杂问题的智能回答
- **多领域覆盖**：涵盖全网、网页、学术、新闻等信息源
- **参考资料**：可选择是否包含答案的参考来源
- **上下文理解**：基于大模型的深度理解能力

### 📖 metasoReader - 网页读取
- **智能解析**：自动提取网页核心内容
- **元数据支持**：可选择包含页面标题、描述等元信息
- **格式化输出**：结构化展示网页内容
- **URL 验证**：严格的 URL 格式检查

## 安装配置

### 1. 获取 API Key
访问 [Metaso 官网](https://metaso.cn) 注册账号并获取 API Key。

### 2. 插件配置
在 FastGPT 中添加 Metaso 插件，配置 API Key：

```json
{
  "apiKey": "your-metaso-api-key"
}
```

## 使用指南

### metasoSearch 使用示例

**基础搜索**
```json
{
  "apiKey": "your-api-key",
  "query": "人工智能最新发展",
  "scope": "all",
  "includeSummary": true,
  "size": 5
}
```

**学术搜索**
```json
{
  "apiKey": "your-api-key", 
  "query": "机器学习算法研究",
  "scope": "academic",
  "includeSummary": true,
  "size": 10
}
```

### metasoAsk 使用示例

**智能问答**
```json
{
  "apiKey": "your-api-key",
  "question": "什么是大语言模型？它有哪些应用场景？",
  "scope": "all",
  "includeReferences": true
}
```

**新闻问答**
```json
{
  "apiKey": "your-api-key",
  "question": "最近有哪些重要的科技新闻？",
  "scope": "news", 
  "includeReferences": true
}
```

### metasoReader 使用示例

**网页内容读取**
```json
{
  "apiKey": "your-api-key",
  "url": "https://example.com/article",
  "includeMetadata": true
}
```

## 工作流集成

### 搜索 → 问答 → 读取 工作流

1. **搜索阶段**：使用 metasoSearch 搜索相关信息
2. **问答阶段**：基于搜索结果使用 metasoAsk 深入分析
3. **读取阶段**：使用 metasoReader 获取具体网页详细内容

### Reference 参数支持

所有工具都支持 reference 参数，可以在工作流中传递：
- `query`（搜索关键词）
- `question`（问题内容）
- `url`（网页链接）

## 参数说明

### 通用参数
- `apiKey` (必需): Metaso API 密钥

### metasoSearch 参数
- `query` (必需): 搜索关键词
- `scope` (可选): 搜索范围，默认 "all"
  - `all`: 全网搜索
  - `webpage`: 网页搜索
  - `academic`: 学术搜索
  - `news`: 新闻搜索
- `includeSummary` (可选): 是否包含摘要，默认 true
- `size` (可选): 结果数量，默认 10，范围 1-20

### metasoAsk 参数
- `question` (必需): 要询问的问题
- `scope` (可选): 信息来源范围，默认 "all"
- `includeReferences` (可选): 是否包含参考资料，默认 true

### metasoReader 参数
- `url` (必需): 要读取的网页 URL
- `includeMetadata` (可选): 是否包含元数据，默认 true

## 错误处理

插件包含完善的错误处理机制：

- **参数验证**：自动验证输入参数格式和必需性
- **API 错误**：友好的 API 调用错误提示
- **网络异常**：网络连接问题的处理
- **格式错误**：URL 格式等验证错误

## 开发测试

### 运行测试
```bash
# 运行所有测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 单次运行测试
npm run test:run
```

### 构建插件
```bash
npm run build
```

## 技术架构

### 目录结构
```
metaso/
├── config.ts              # 主配置文件
├── index.ts               # 入口文件
├── children/               # 子工具目录
│   ├── metasoSearch/      # 搜索工具
│   ├── metasoAsk/         # 问答工具
│   └── metasoReader/      # 读取工具
├── test/                  # 测试文件
├── package.json           # 依赖配置
└── README.md             # 文档
```

### 核心技术
- **TypeScript**: 类型安全的开发体验
- **Zod**: 运行时参数验证
- **Vitest**: 现代化测试框架
- **模块化设计**: 清晰的代码组织结构

## 版本历史

### v1.0.0
- ✅ 实现 metasoSearch 搜索功能
- ✅ 实现 metasoAsk 问答功能  
- ✅ 实现 metasoReader 读取功能
- ✅ 完善错误处理和参数验证
- ✅ 添加完整的测试覆盖
- ✅ 支持工作流 reference 参数

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码变更
4. 运行测试确保通过
5. 提交 Pull Request

## 许可证

本项目采用 MIT 许可证。

## 支持与反馈

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件
- 参与讨论

---

**注意**: 使用本插件需要有效的 Metaso API Key。请确保遵守 Metaso 服务条款和使用限制。