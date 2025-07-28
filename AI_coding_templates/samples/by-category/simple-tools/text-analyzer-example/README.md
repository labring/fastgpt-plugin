# 文本分析处理插件

这是一个简单而实用的文本分析处理插件示例，展示了基础文本处理功能的实现。

## 功能特点

- 📝 文本基础统计（字数、行数、段落数）
- 🔤 字符频率分析
- 📊 关键词提取和词频统计
- 🌐 语言检测
- 📏 文本相似度计算
- 🧹 文本清洗和格式化

## 支持的操作

### 基础统计
- 字符数统计（包含/不包含空格）
- 单词数统计
- 行数和段落数统计
- 平均句子长度

### 文本分析
- 词频统计
- 关键词提取
- 语言检测
- 情感倾向分析（简单）

### 文本处理
- 去除多余空格
- 标点符号处理
- 大小写转换
- 特殊字符过滤

## 使用示例

```typescript
// 基础文本统计
const stats = await tool({
  text: "这是一段示例文本。包含中文和English混合内容。",
  operation: "statistics",
  options: {
    includeSpaces: true,
    detectLanguage: true
  }
});

// 词频分析
const wordFreq = await tool({
  text: "文本分析 文本处理 数据分析 文本分析",
  operation: "word_frequency",
  options: {
    minLength: 2,
    topN: 10
  }
});

// 文本清洗
const cleaned = await tool({
  text: "  这是   一段  需要清洗的   文本！！！  ",
  operation: "clean",
  options: {
    removeExtraSpaces: true,
    normalizePunctuation: true
  }
});
```

## 文件结构

```
text-analyzer-example/
├── README.md           # 说明文档
├── config.ts          # 插件配置
├── index.ts           # 导出入口
├── package.json       # 依赖配置
├── src/
│   ├── index.ts       # 核心实现
│   ├── types.ts       # 类型定义
│   ├── analyzers/     # 分析器模块
│   │   ├── statistics.ts    # 统计分析
│   │   ├── frequency.ts     # 频率分析
│   │   ├── language.ts      # 语言检测
│   │   └── similarity.ts    # 相似度计算
│   ├── processors/    # 处理器模块
│   │   ├── cleaner.ts       # 文本清洗
│   │   ├── formatter.ts     # 格式化
│   │   └── extractor.ts     # 内容提取
│   └── utils/         # 工具函数
│       ├── tokenizer.ts     # 分词器
│       ├── validators.ts    # 验证器
│       └── helpers.ts       # 辅助函数
└── test/
    └── index.test.ts  # 测试用例
```

## 开发要点

### 文本处理
- 支持中英文混合文本
- 正确的分词和断句
- Unicode字符处理
- 多种编码格式支持

### 性能优化
- 大文本分块处理
- 缓存常用计算结果
- 惰性计算策略
- 内存使用控制

### 准确性
- 语言特定的处理规则
- 标点符号正确识别
- 特殊字符处理
- 边界情况处理

### 扩展性
- 模块化的分析器设计
- 可配置的处理选项
- 插件式功能扩展
- 多语言支持框架