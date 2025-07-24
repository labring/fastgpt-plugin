# 添加 Metaso 插件

## 📝 变更说明

### 新增功能
- ✅ 添加 Metaso 插件，提供强大的网络搜索、智能问答和网页内容读取功能
- ✅ 支持 metasoSearch - 智能搜索功能
- ✅ 支持 metasoAsk - 智能问答功能  
- ✅ 支持 metasoReader - 网页读取功能
- ✅ 完整的 TypeScript 类型定义和参数验证
- ✅ 支持工作流 reference 参数传递

### 插件特性

#### 🔍 metasoSearch - 智能搜索
- **多范围搜索**：支持全网、网页、学术、新闻等不同搜索范围
- **智能摘要**：可选择是否包含搜索结果摘要
- **结果数量控制**：灵活设置返回结果数量（1-20条）
- **工作流集成**：支持 reference 参数，便于工作流中传递搜索关键词

#### 💬 metasoAsk - 智能问答
- **自然语言问答**：支持复杂问题的智能回答
- **多领域覆盖**：涵盖全网、网页、学术、新闻等信息源
- **参考资料**：可选择是否包含答案的参考来源
- **上下文理解**：基于大模型的深度理解能力

#### 📖 metasoReader - 网页读取
- **智能解析**：自动提取网页核心内容
- **元数据支持**：可选择包含页面标题、描述等元信息
- **格式化输出**：结构化展示网页内容
- **URL 验证**：严格的 URL 格式检查

## 🧪 测试情况

- ✅ 本地功能测试通过
- ✅ 代码规范检查通过
- ✅ 完整的集成测试覆盖
- ✅ 参数验证测试
- ✅ 错误处理测试
- ✅ 文档完整性检查

## 📋 检查清单

- ✅ 代码遵循项目规范
- ✅ 添加了适当的中文注释
- ✅ 更新了相关文档（README.md）
- ✅ 测试覆盖新功能
- ✅ 没有引入破坏性变更
- ✅ 使用 TypeScript 和 Zod 进行类型安全
- ✅ 模块化设计，便于维护

## 🔧 技术实现

### 目录结构
```
metaso/
├── config.ts              # 主配置文件
├── index.ts               # 入口文件
├── children/               # 子工具目录
│   ├── metasoSearch/      # 搜索工具
│   ├── metasoAsk/         # 问答工具
│   └── metasoReader/      # 读取工具
├── src/                   # 核心实现
│   ├── api.ts            # API 调用封装
│   ├── types.ts          # 类型定义
│   ├── utils.ts          # 工具函数
│   └── config.ts         # 配置管理
├── test/                  # 测试文件
├── package.json           # 依赖配置
└── README.md             # 详细文档
```

### 核心技术
- **TypeScript**: 类型安全的开发体验
- **Zod**: 运行时参数验证
- **Vitest**: 现代化测试框架
- **模块化设计**: 清晰的代码组织结构

## 📚 使用示例

### metasoSearch 使用示例
```json
{
  "apiKey": "your-api-key",
  "query": "人工智能最新发展",
  "scope": "all",
  "includeSummary": true,
  "size": 5
}
```

### metasoAsk 使用示例
```json
{
  "apiKey": "your-api-key",
  "question": "什么是大语言模型？它有哪些应用场景？",
  "scope": "all",
  "includeReferences": true
}
```

### metasoReader 使用示例
```json
{
  "apiKey": "your-api-key",
  "url": "https://example.com/article",
  "includeMetadata": true
}
```

## 🔗 相关链接

- Metaso 官网: https://metaso.cn
- 插件文档: [README.md](modules/tool/packages/metaso/README.md)
- 设计文档: [设计文档.md](modules/tool/packages/metaso/设计文档.md)
- 开发计划: [开发计划.md](modules/tool/packages/metaso/开发计划.md)
- 开发日志: [开发日志.md](modules/tool/packages/metaso/开发日志.md)

## 🎯 版本信息

- **版本**: v1.0.0
- **作者**: qinxiaoqiang
- **许可**: 遵循项目许可协议