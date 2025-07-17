
# FastGPT 插件开发框架指南

基于最佳实践构建的 FastGPT 插件开发标准化框架

## 🚨 重要开发原则

### 开发顺序要求（必须严格遵守）
**⚠️ 关键原则：先开发一个子功能，确保代码完全正确后，再快速开发其他功能**

1. **单一功能优先**：选择最简单的子工具先完成开发
2. **完整验证**：确保该子工具的所有代码都正确无误
3. **构建测试**：运行 `npm run build` 或者 `npx tsc --noEmit --skipLibCheck`  确保构建成功
4. **功能测试**：验证该子工具功能正常
5. **复制扩展**：基于正确的模板快速开发其他子工具
6. **避免全量开发**：禁止一次性开发所有功能后重复修改全部代码

**错误示例**：❌ 同时开发多个工具 → 发现错误 → 修改多个文件 → 重复多次
**正确示例**：✅ 开发单个工具 → 验证正确 → 复制模板开发其他工具

## 🐛 高频错误修复指南

### 1. TypeScript 类型错误

#### 错误1：未定义类型引用
**错误描述**：`Cannot find name 'SomeType'` 或类似的类型未定义错误
**原因**：引用了未定义或未正确导入的类型
**修复方法**：
- 检查类型定义文件中是否存在该类型
- 确保正确导入类型
- 如果类型不存在，需要定义或移除引用

```typescript
// ❌ 错误代码
export interface ToolOutput {
  data: UndefinedType[];  // UndefinedType 类型未定义
}

// ✅ 正确代码
export interface ToolOutput {
  data: DefinedType[];  // 使用已定义的类型
}

export interface DefinedType {
  id: string;
  name: string;
}
```

#### 错误2：导入路径错误
**错误描述**：`Module '"../path/types"' has no exported member 'SomeType'`
**原因**：导入路径不正确或导出的成员名称错误
**修复方法**：
- 检查文件路径是否正确
- 确认导出的成员名称
- 使用相对路径时注意层级关系

```typescript
// ❌ 错误代码
import { WrongType } from '../wrong/path';  // 路径或导出名错误

// ✅ 正确代码
import { CorrectType } from '../correct/path';  // 确保路径和导出名正确
```

### 2. FastGPT 配置错误

#### 错误3：工具类型枚举错误
**错误描述**：`Type '"tool"' is not assignable to type 'ToolTypeEnum | undefined'`
**原因**：使用了错误的工具类型值
**修复方法**：使用正确的 ToolTypeEnum 枚举值

```typescript
// ❌ 错误代码
export const config = defineTool({
  type: 'tool',  // 错误的类型值
  // ...
});

// ✅ 正确代码
export const config = defineTool({
  type: ToolTypeEnum.tools,  // 使用正确的枚举值
  // ...
});
```

#### 错误4：配置结构错误
**错误描述**：`Object literal may only specify known properties, and 'version' does not exist`
**原因**：配置对象中使用了不存在的属性名
**修复方法**：使用正确的属性名

```typescript
// ❌ 错误代码
versionList: [
  {
    version: '1.0.0',  // 错误的属性名
    // ...
  }
]

// ✅ 正确代码
versionList: [
  {
    value: '1.0.0',  // 正确的属性名
    // ...
  }
]
```

### 3. 输入输出参数配置错误

#### 错误5：缺少必需的参数属性
**错误描述**：构建时提示缺少 `toolDescription` 或其他必需属性
**原因**：输入参数配置不完整
**修复方法**：添加所有必需的属性

```typescript
// ❌ 错误代码
{
  key: 'input',
  valueType: WorkflowIOValueTypeEnum.string,
  label: '输入内容',
  // 缺少 toolDescription
}

// ✅ 正确代码
{
  key: 'input',
  valueType: WorkflowIOValueTypeEnum.string,
  label: '输入内容',
  toolDescription: '输入要处理的内容',  // 添加必需属性
  renderTypeList: [FlowNodeInputTypeEnum.textarea],
  required: true
}
```

### 4. 构建插件错误

#### 错误6：空指针访问错误
**错误描述**：`undefined is not an object (evaluating 'object.property')`
**原因**：在访问对象属性前没有检查对象是否存在
**修复方法**：添加存在性检查

```typescript
// ❌ 错误代码
if (obj.property.type === 'expected') {
  // 直接访问可能为 undefined 的属性
}

// ✅ 正确代码
if (obj.property && obj.property.type === 'expected') {
  // 先检查对象存在再访问属性
}
```

### 5. 字符编码错误

#### 错误7：全角字符导致语法错误
**错误描述**：意外的字符或语法错误
**原因**：使用了全角标点符号
**修复方法**：所有代码必须使用半角字符

```typescript
// ❌ 错误代码（全角字符）
const config = {
  name: '工具名称'，  // 全角逗号
  description: '工具描述'；  // 全角分号
}

// ✅ 正确代码（半角字符）
const config = {
  name: '工具名称',  // 半角逗号
  description: '工具描述';  // 半角分号
}
```

### 6. 多语言配置错误

#### 错误8：缺少多语言支持
**错误描述**：配置中只有单一语言
**原因**：FastGPT 要求支持多语言配置
**修复方法**：为 name 和 description 添加多语言支持

```typescript
// ❌ 错误代码
name: '工具名称',
description: '工具描述',

// ✅ 正确代码
name: {
  'zh-CN': '工具名称',
  'en-US': 'Tool Name'
},
description: {
  'zh-CN': '工具描述',
  'en-US': 'Tool Description'
},
```

## 🛠 技术栈

### 核心技术
- **运行时**: Node.js 18+
- **语言**: TypeScript 严格模式
- **包管理**: Bun (推荐) / npm
- **测试框架**: Vitest
- **代码规范**: ESLint + Prettier

### 开发环境配置

#### 包管理
- **推荐使用 Bun** - 更快的包管理器和运行时
  ```bash
  # 安装 Bun
  curl -fsSL https://bun.sh/install | bash
  
  # 安装依赖
  bun install
  
  # 运行脚本
  bun run dev
  bun test
  ```
- **备选方案** - npm/yarn (如果 Bun 不可用)
  ```bash
  npm install
  npm run dev
  npm test
  ```

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

### 8. ToolSet 配置错误（关键错误）

#### 错误9：Cannot read properties of undefined (reading '0')
**错误描述**：FastGPT 主程序无法显示插件，控制台报错 `Cannot read properties of undefined (reading '0')`
**原因**：ToolSet 配置中缺少 `children` 数组配置，或子工具导出结构错误
**修复方法**：
1. 在主配置文件中添加 children 数组
2. 修复所有子工具的导出结构

**主配置文件修复**：
```typescript
// ❌ 错误代码 - 缺少 children 数组
import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineToolSet({
  name: { 'zh-CN': '工具集名称' },
  type: ToolTypeEnum.tools,
  // 缺少 children 数组配置
});

// ✅ 正确代码 - 添加 children 数组
import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';
import subTool1 from './children/subTool1';
import subTool2 from './children/subTool2';

export default defineToolSet({
  name: { 'zh-CN': '工具集名称' },
  type: ToolTypeEnum.tools,
  children: [subTool1, subTool2]  // 必须包含 children 数组
});
```

**子工具导出结构修复**：
```typescript
// ❌ 错误代码 - 错误的导出结构
import { InputType, OutputType, tool as toolCb } from './src/index';
import config from './config';

export default {
  InputType,
  OutputType,
  toolCb,
  config
};

// ✅ 正确代码 - 使用 exportTool 函数
import config from './config';
import { InputType, OutputType, tool as toolCb } from './src';
import { exportTool } from '@tool/utils/tool';

export default exportTool({
  toolCb,
  InputType,
  OutputType,
  config
});
```

**关键检查点**：
1. 确保主配置文件导入了所有子工具
2. 确保 children 数组包含所有子工具
3. 确保所有子工具使用 exportTool 函数导出
4. 确保导入路径正确（'./src' 而不是 './src/index'）

---

**遵循此框架可以确保 FastGPT 插件的高质量、可维护性和一致性。** 🎯
