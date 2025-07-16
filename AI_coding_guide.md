
# FastGPT 插件开发框架指南

基于最佳实践构建的 FastGPT 插件开发标准化框架

## 🛠 技术栈

### 核心技术
- **运行时**: Node.js 18+
- **语言**: TypeScript 严格模式
- **包管理**: Bun (推荐) / npm
- **测试框架**: Vitest
- **代码规范**: ESLint + Prettier

### FastGPT 特定
- **插件系统**: FastGPT Plugin API
- **类型定义**: `PluginInputModule`, `PluginOutputModule`
- **配置系统**: `PluginConfig` 接口
- **工具集成**: FastGPT Tool System

## 📁 项目架构

### 标准插件结构
```
modules/tool/packages/your-plugin/
├── config.ts              # 插件配置和元信息
├── index.ts               # 插件入口和类型导出
├── package.json           # 插件包信息
├── README.md              # 插件文档
└── src/
    ├── index.ts           # 核心业务逻辑
    ├── types.ts           # 类型定义
    ├── utils.ts           # 工具函数
    ├── constants.ts       # 常量定义
    ├── api/               # API 相关
    │   ├── client.ts      # API 客户端
    │   └── types.ts       # API 类型
    ├── validators/        # 数据验证
    │   └── schema.ts      # 验证模式
    └── __tests__/         # 测试文件
        └── index.test.ts  # 单元测试
```

### 全局项目结构
- `/modules/tool/` - 插件系统核心
- `/scripts/` - 开发脚本和工具
- `/test/` - 全局测试配置
- `/sdk/` - SDK 开发工具

## 🚀 开发命令

### 基础命令
```bash
# 启动开发服务器
bun run dev

# 创建新插件
bun run newTool

# 构建项目
bun run build

# 运行测试
bun run test

# 代码检查
bun run lint

# 代码格式化
bun run prettier
```

### 插件特定命令
```bash
# 测试特定插件
bun test -- your-plugin

# 构建特定插件
bun run build:plugin your-plugin

# 验证插件配置
bun run validate:plugin your-plugin
```

## 📝 代码规范

### TypeScript 规范
```typescript
// ✅ 推荐：严格类型定义
interface PluginInput {
  query: string;
  options?: {
    limit?: number;
    format?: 'json' | 'xml';
  };
}

// ✅ 推荐：明确的返回类型
export default async function handler(
  input: PluginInput
): Promise<PluginOutput> {
  // 实现逻辑
}

// ❌ 避免：使用 any 类型
function badHandler(input: any): any {
  // 不推荐
}
```

### 插件配置规范
```typescript
// config.ts 标准格式
import type { PluginConfig } from '../../type';

export const config: PluginConfig = {
  id: 'your-plugin-id',           // 唯一标识符，kebab-case
  name: '插件显示名称',              // 用户友好的名称
  description: '插件功能描述',       // 详细功能说明
  avatar: '/imgs/tools/icon.svg',  // 插件图标路径
  author: '作者名称',               // 开发者信息
  version: '1.0.0',               // 语义化版本
  documentUrl: 'https://...',     // 文档链接
  isActive: true                  // 是否启用
};
```

### 输入输出定义规范
```typescript
// 输入参数定义
const pluginInput: PluginInputModule[] = [
  {
    key: 'query',                    // 参数键名
    type: 'string',                  // 数据类型
    label: '查询内容',                // 显示标签
    description: '要查询的具体内容',   // 详细描述
    required: true,                  // 是否必需
    placeholder: '请输入查询内容...'   // 占位符文本
  }
];

// 输出结果定义
const pluginOutput: PluginOutputModule[] = [
  {
    key: 'result',
    type: 'string',
    label: '查询结果',
    description: '处理后的查询结果'
  }
];
```

### 错误处理规范
```typescript
// ✅ 推荐：统一错误处理
export default async function handler(input: PluginInput) {
  try {
    // 输入验证
    if (!input.query?.trim()) {
      throw new Error('查询内容不能为空');
    }

    // 业务逻辑
    const result = await processQuery(input.query);
    
    return {
      result: result.data,
      status: 'success'
    };
  } catch (error) {
    // 错误日志记录
    console.error(`[${config.id}] 处理失败:`, error);
    
    // 用户友好的错误信息
    throw new Error(
      error instanceof Error 
        ? `处理失败: ${error.message}`
        : '未知错误，请稍后重试'
    );
  }
}
```

### 文件命名约定
- **插件目录**: `kebab-case` (如: `clinical-trials`)
- **TypeScript 文件**: `camelCase.ts` (如: `apiClient.ts`)
- **类型文件**: `PascalCase.ts` (如: `ApiTypes.ts`)
- **测试文件**: `*.test.ts` 或 `*.spec.ts`
- **配置文件**: 保持原有命名 (`config.ts`, `package.json`)

## 🧪 测试规范

### 单元测试结构
```typescript
// src/__tests__/index.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import handler from '../index';

describe('YourPlugin', () => {
  beforeEach(() => {
    // 测试前置条件
  });

  it('应该正确处理有效输入', async () => {
    const input = { query: '测试查询' };
    const result = await handler(input);
    
    expect(result).toHaveProperty('result');
    expect(result.result).toBeTruthy();
  });

  it('应该处理无效输入', async () => {
    const input = { query: '' };
    
    await expect(handler(input)).rejects.toThrow('查询内容不能为空');
  });
});
```

### 测试覆盖率要求
- **核心逻辑**: 90%+ 覆盖率
- **错误处理**: 100% 覆盖率
- **边界条件**: 完整测试
- **API 集成**: 模拟测试

## 🔧 开发工具配置

### ESLint 配置重点
```javascript
// eslint.config.js 关键规则
export default [
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      'prefer-const': 'error',
      'no-console': 'warn' // 生产环境应移除 console
    }
  }
];
```

### Prettier 配置
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

## 📚 最佳实践

### 性能优化
- **异步处理**: 使用 `async/await` 处理异步操作
- **错误边界**: 实现完整的错误捕获和处理
- **资源管理**: 及时释放网络连接和文件句柄
- **缓存策略**: 合理使用缓存减少重复计算

### 安全考虑
- **输入验证**: 严格验证所有用户输入
- **API 密钥**: 使用环境变量管理敏感信息
- **数据清理**: 防止 XSS 和注入攻击
- **权限控制**: 实现适当的访问控制

### 文档要求
- **README.md**: 完整的使用说明和示例
- **代码注释**: 关键逻辑添加中文注释
- **类型注释**: 复杂类型提供详细说明
- **变更日志**: 记录版本更新内容

## 🔄 Git 工作流

### 分支策略
```bash
# 功能开发
git checkout -b feat/plugin-name

# 问题修复
git checkout -b fix/issue-description

# 文档更新
git checkout -b docs/update-readme
```

### 提交信息规范
```bash
# 功能相关
feat(plugin-name): 添加新功能描述
fix(plugin-name): 修复具体问题
perf(plugin-name): 性能优化说明

# 文档和配置
docs: 更新插件文档
test: 添加测试用例
chore: 更新依赖或配置
```

## ⚠️ 开发注意事项

### 常见陷阱
1. **类型安全**: 避免使用 `any` 类型，确保类型安全
2. **错误处理**: 不要忽略异常情况，提供用户友好的错误信息
3. **资源泄漏**: 确保正确关闭网络连接和文件流
4. **版本兼容**: 注意 FastGPT API 版本兼容性

### 性能建议
1. **批量处理**: 对于大量数据，使用批量处理减少 API 调用
2. **超时设置**: 为网络请求设置合理的超时时间
3. **内存管理**: 避免内存泄漏，及时清理大对象
4. **并发控制**: 合理控制并发请求数量

### 调试技巧
1. **日志记录**: 使用结构化日志记录关键信息
2. **环境变量**: 使用 `NODE_ENV` 区分开发和生产环境
3. **测试数据**: 准备充分的测试数据集
4. **错误重现**: 建立可重现的错误场景

## 🚀 部署和发布

### 发布前检查清单
- [ ] 所有测试通过
- [ ] 代码规范检查通过
- [ ] 文档完整且准确
- [ ] 版本号正确更新
- [ ] 变更日志已更新
- [ ] 安全性检查完成

### 版本管理
```bash
# 更新版本
npm version patch  # 修复版本
npm version minor  # 功能版本
npm version major  # 重大版本

# 发布标签
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

---

**遵循此框架可以确保 FastGPT 插件的高质量、可维护性和一致性。** 🎯
