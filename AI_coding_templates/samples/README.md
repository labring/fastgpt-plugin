# FastGPT 插件示例代码库

欢迎使用 FastGPT 插件示例代码库！这里提供了完整的插件开发模板、示例代码和最佳实践，帮助开发者快速构建高质量的 FastGPT 插件。

## 📁 目录结构

```
samples/
├── README.md                          # 本文档
├── common/                            # 共性代码模板
│   ├── templates/                     # 基础模板
│   ├── utils/                        # 通用工具函数
│   └── patterns/                     # 常见设计模式
├── by-category/                      # 按类型分类的完整示例
│   ├── simple-tools/                 # 简单工具类示例
│   ├── api-integrations/             # API集成类示例
│   ├── toolsets/                     # 工具集类示例
│   └── data-processing/              # 数据处理类示例
└── best-practices/                   # 最佳实践示例
    ├── error-handling/
    ├── testing-patterns/
    ├── performance-optimization/
    └── security-practices/
```

## 🚀 快速开始

### 环境准备
```bash
# 安装 Bun (推荐的包管理器)
curl -fsSL https://bun.sh/install | bash

# 验证安装
bun --version
```

### 1. 选择合适的模板
根据你要开发的插件类型，选择对应的模板：

- **简单工具类**：功能单一，逻辑简单的工具（如格式化、计算等）
- **API集成类**：调用外部API服务的插件（如搜索、翻译等）
- **工具集类**：包含多个子工具的复合插件
- **数据处理类**：复杂的数据处理和分析插件

### 2. 复制模板
```bash
# 复制对应类型的模板到你的插件目录
cp -r samples/common/templates/[模板类型] modules/tool/packages/[你的插件名]
```

### 3. 自定义配置
1. 修改 `config.ts` 中的插件元数据
2. 实现 `src/index.ts` 中的核心逻辑
3. 更新 `package.json` 中的依赖
4. 编写测试用例

### 4. 安装依赖和测试验证
```bash
# 安装依赖 (推荐使用 Bun)
bun install

# 运行测试
bun test [你的插件名]

# 启动开发服务器
bun run dev

# 构建项目
bun run build
```

## 📚 学习路径

### 新手开发者
1. 从 `simple-tools` 示例开始学习
2. 理解基础的插件结构和配置
3. 学习错误处理和测试模式
4. 逐步尝试更复杂的插件类型

### 有经验的开发者
1. 直接查看对应类型的完整示例
2. 参考最佳实践和设计模式
3. 关注性能优化和安全实践
4. 贡献优秀的示例代码

### AI 编程助手
1. 使用模板快速生成插件骨架
2. 参考示例代码理解业务逻辑
3. 遵循最佳实践确保代码质量
4. 利用测试模板验证功能正确性

## 🛠️ 开发工具

### 包管理器
```bash
# 推荐使用 Bun (更快的安装和运行)
bun install                    # 安装依赖
bun add <package>             # 添加依赖
bun remove <package>          # 移除依赖
bun update                    # 更新依赖

# 备选方案 (如果 Bun 不可用)
npm install
npm install <package>
npm uninstall <package>
```

### 代码生成
```bash
# 使用官方脚手架创建新插件
bun run newTool

# 基于示例模板创建插件
cp -r samples/common/templates/[类型] modules/tool/packages/[插件名]
```

### 调试工具
- 开发服务器：`bun run dev`
- 测试运行器：`bun test`
- 类型检查：`bun run type-check`
- 代码检查：`bun run lint`
- 代码格式化：`bun run format`

### 代码质量
- ESLint 配置
- Prettier 格式化
- TypeScript 类型检查
- 单元测试覆盖

## 📖 文档资源

- [插件开发指南](../INITIAL_clinicaltrials.md)
- [插件生态蓝图](../plugin_ecosystem_blueprint.md)
- [测试指南](../test.md)
- [API 开发示例](./CLINICALTRIALS_API_DEVELOPMENT_GUIDE.md)

## 🤝 贡献指南

我们欢迎社区贡献优秀的示例代码和最佳实践：

1. **提交示例**：分享你的优秀插件实现
2. **改进模板**：优化现有模板的结构和代码
3. **完善文档**：补充说明和使用指南
4. **报告问题**：发现问题及时反馈

### 贡献标准
- 代码规范：遵循项目的编码标准
- 测试覆盖：提供完整的测试用例
- 文档完善：包含详细的使用说明
- 安全实践：遵循安全编码规范

## 📝 版本历史

- **v1.0.0** - 初始版本，包含基础模板和示例
- **v1.1.0** - 新增最佳实践示例
- **v1.2.0** - 完善工具集类型支持

## 📞 支持与反馈

- 问题反馈：[GitHub Issues](https://github.com/labring/FastGPT/issues)
- 讨论交流：[GitHub Discussions](https://github.com/labring/FastGPT/discussions)
- 文档贡献：[文档仓库](https://github.com/labring/FastGPT)

---

**开始你的 FastGPT 插件开发之旅吧！** 🎉