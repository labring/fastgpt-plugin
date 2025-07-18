# FastGPT 插件开发模板和最佳实践

这是一个完整的 FastGPT 插件开发模板库，包含了最佳实践、设计模式、工具函数和示例代码，帮助开发者快速构建高质量的 FastGPT 插件。

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- Bun >= 1.0.0 (推荐包管理器)
- TypeScript >= 5.0.0
- 支持 ES2022 的现代浏览器

### 安装依赖

```bash
# 使用 Bun (推荐)
bun install

# 或使用 npm
npm install
```

### 运行测试

```bash
# 运行所有测试
bun test

# 监听模式运行测试
bun run test:watch

# 生成测试覆盖率报告
bun run test:coverage
```

### 构建项目

```bash
# 编译 TypeScript
bun run build

# 开发模式（监听文件变化）
bun run dev
```

### 代码质量检查

```bash
# ESLint 检查
bun run lint

# 自动修复 ESLint 问题
bun run lint:fix

# Prettier 格式化
bun run format

# TypeScript 类型检查
bun run type-check
```

## 📁 项目结构

```
fastgpt-plugin-templates/
├── samples/                          # 示例插件
│   ├── text-analyzer-example/        # 文本分析插件示例
│   │   ├── src/
│   │   │   ├── index.ts              # 插件入口
│   │   │   ├── handlers/             # 处理器
│   │   │   ├── utils/                # 工具函数
│   │   │   └── types/                # 类型定义
│   │   ├── package.json
│   │   └── README.md
│   └── common/                       # 通用工具库
│       ├── utils/                    # 工具函数
│       │   ├── validation.ts         # 数据验证
│       │   ├── data-cleaner.ts       # 数据清洗
│       │   ├── formatter.ts          # 格式化工具
│       │   ├── data-converter.ts     # 数据转换
│       │   ├── async-utils.ts        # 异步控制
│       │   ├── cache.ts              # 缓存管理
│       │   ├── common-helpers.ts     # 通用辅助函数
│       │   ├── index.ts              # 统一导出
│       │   ├── examples.md           # 使用示例
│       │   ├── GUIDE.md              # 使用指南
│       │   └── utils.test.ts         # 测试文件
│       └── types/                    # 通用类型定义
├── best-practices/                   # 最佳实践指南
│   ├── design-patterns/              # 设计模式
│   │   └── README.md                 # 设计模式指南
│   ├── testing-patterns/             # 测试模式
│   │   └── README.md                 # 测试最佳实践
│   ├── performance/                  # 性能优化
│   │   └── README.md                 # 性能优化指南
│   └── security/                     # 安全实践
│       └── README.md                 # 安全开发指南
├── docs/                             # 文档
│   ├── api/                          # API 文档
│   ├── guides/                       # 开发指南
│   └── examples/                     # 示例文档
├── package.json                      # 项目配置
├── tsconfig.json                     # TypeScript 配置
├── vitest.config.ts                  # 测试配置
├── .eslintrc.js                      # ESLint 配置
├── .prettierrc                       # Prettier 配置
└── README.md                         # 项目说明
```

## 🛠️ 核心功能

### 1. 通用工具函数库

提供完整的工具函数集合，包括：

- **数据验证** - 字符串、数字、邮箱、URL、JSON 等格式验证
- **数据清洗** - HTML 清理、空白字符处理、特殊字符移除等
- **文本格式化** - 数字、货币、日期、文件大小等格式化
- **数据转换** - CSV/JSON 转换、对象扁平化、数组操作等
- **异步控制** - 延迟、超时、重试、并发控制、批处理等
- **缓存管理** - 内存缓存、LRU 缓存、缓存装饰器等
- **通用辅助** - ID 生成、空值检查、嵌套属性操作等

### 2. 设计模式实现

包含 FastGPT 插件开发中常用的设计模式：

- **工厂模式** - 创建不同类型的处理器
- **策略模式** - 实现不同的算法策略
- **观察者模式** - 事件处理和状态变化
- **装饰器模式** - 为工具添加额外功能
- **责任链模式** - 复杂数据处理流程

### 3. 测试最佳实践

提供完整的测试策略和模式：

- **测试金字塔** - 单元测试、集成测试、端到端测试
- **数据驱动测试** - 参数化测试和测试数据管理
- **Mock 和 Stub** - 依赖隔离和测试替身
- **性能测试** - 响应时间、并发、内存使用测试
- **持续集成** - GitHub Actions 配置

### 4. 示例插件

包含完整的示例插件实现：

- **文本分析插件** - 文本统计、关键词提取、语言检测等
- **数据处理插件** - 数据清洗、格式转换、批量处理等
- **工具集成插件** - 第三方服务集成、API 调用等

## 📚 使用指南

### 创建新插件

1. **复制示例模板**
   ```bash
   cp -r samples/text-analyzer-example my-new-plugin
   cd my-new-plugin
   ```

2. **修改配置文件**
   ```json
   // package.json
   {
     "name": "my-new-plugin",
     "description": "我的新插件",
     // ...
   }
   ```

3. **实现插件逻辑**
   ```typescript
   // src/index.ts
   import { PluginHandler } from './handlers/plugin-handler';
   
   export default async function handler(params: any) {
     const pluginHandler = new PluginHandler();
     return await pluginHandler.process(params);
   }
   ```

### 使用工具函数

```typescript
import {
  InputValidator,
  DataCleaner,
  TextFormatter,
  AsyncUtils,
  MemoryCache
} from './common/utils';

// 数据验证
InputValidator.validateEmail('user@example.com');

// 数据清洗
const cleanText = DataCleaner.normalizeWhitespace('  hello   world  ');

// 格式化
const formattedSize = TextFormatter.formatFileSize(1024 * 1024);

// 异步控制
await AsyncUtils.delay(1000);

// 缓存管理
const cache = new MemoryCache<string>(100, 60000);
cache.set('key', 'value');
```

### 编写测试

```typescript
import { describe, it, expect } from 'vitest';
import { MyPlugin } from './my-plugin';

describe('MyPlugin', () => {
  it('should process data correctly', async () => {
    const plugin = new MyPlugin();
    const result = await plugin.process({ input: 'test' });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});
```

## 🎯 最佳实践

### 1. 代码组织

- **模块化设计** - 将功能拆分为独立的模块
- **单一职责** - 每个类和函数只负责一个功能
- **依赖注入** - 使用依赖注入提高可测试性
- **接口隔离** - 定义清晰的接口边界

### 2. 错误处理

```typescript
try {
  const result = await processData(input);
  return { success: true, data: result };
} catch (error) {
  console.error('处理失败:', error.message);
  return { 
    success: false, 
    error: error.message,
    code: 'PROCESS_ERROR'
  };
}
```

### 3. 性能优化

```typescript
// 使用缓存
const cache = new MemoryCache<string>(1000, 300000);

// 并发控制
const results = await AsyncUtils.concurrent(tasks, 5);

// 批处理
const processed = await AsyncUtils.batch(items, processor, 100);
```

### 4. 类型安全

```typescript
interface PluginInput {
  text: string;
  options?: {
    language?: string;
    format?: 'json' | 'text';
  };
}

interface PluginOutput {
  success: boolean;
  data?: any;
  error?: string;
}
```

## 🔧 开发工具

### 代码质量

- **ESLint** - 代码规范检查
- **Prettier** - 代码格式化
- **TypeScript** - 类型检查
- **Vitest** - 单元测试

### 开发环境

- **热重载** - 文件变化自动重新编译
- **调试支持** - VS Code 调试配置
- **Git Hooks** - 提交前自动检查

### 持续集成

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - run: bun install
      - run: bun test
      - run: bun run lint
      - run: bun run type-check
```

## 📖 文档

- [工具函数使用指南](./samples/common/utils/GUIDE.md)
- [设计模式指南](./best-practices/design-patterns/README.md)
- [测试最佳实践](./best-practices/testing-patterns/README.md)
- [API 文档](./docs/api/)
- [开发指南](./docs/guides/)

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

### 贡献流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发规范

- 遵循现有的代码风格
- 添加适当的测试
- 更新相关文档
- 确保所有测试通过

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢所有为 FastGPT 项目做出贡献的开发者！

## 📞 支持

如果您在使用过程中遇到问题，可以通过以下方式获取帮助：

- [GitHub Issues](https://github.com/labring/FastGPT/issues)
- [官方文档](https://doc.fastgpt.in/)
- [社区论坛](https://github.com/labring/FastGPT/discussions)

---

**Happy Coding! 🎉**