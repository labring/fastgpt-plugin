# Children 结构工具集开发指南

## 📋 概述

本指南总结了基于 children 结构的工具集开发经验，以 KnowS 工具集为例，提供完整的开发要点和避坑指南。

## 🏗️ 项目结构

### 标准 Children 工具集结构
```
toolset-name/
├── config.ts              # 工具集主配置
├── index.ts               # 导出入口
├── shared/                # 共享模块
│   ├── api.ts            # API 客户端
│   ├── config.ts         # 配置管理
│   ├── types.ts          # 类型定义
│   └── utils.ts          # 工具函数
├── children/             # 子工具目录
│   ├── tool1/
│   │   ├── config.ts     # 子工具配置
│   │   ├── index.ts      # 子工具导出
│   │   └── src/
│   │       ├── index.ts  # 核心实现
│   │       └── types.ts  # 类型定义
│   ├── tool2/
│   └── ...
└── 开发日志.md           # 开发记录
```

## 🔧 核心开发要点

### 1. 配置管理 (shared/config.ts)

#### ✅ 最佳实践
```typescript
// 强制要求 API Key，提高安全性
export function getKnowsConfig(
  apiKey: string,  // 必填参数
  environment: 'production' | 'development' = 'production'
): KnowsConfig {
  if (!apiKey) {
    throw new Error('API Key is required');
  }
  // ...
}

// 配置验证函数
export function validateConfig(config: KnowsConfig): { valid: boolean; error?: string } {
  if (!config.apiKey) {
    return { valid: false, error: 'API Key is required' };
  }
  // ...
}
```

#### ❌ 避免的陷阱
- 不要提供默认 API Key
- 不要在配置中硬编码敏感信息
- 避免复杂的全局配置管理

### 2. 子工具配置 (children/*/config.ts)

#### ✅ 统一的输入配置模式
```typescript
import { defineInputConfig } from '@tool/type';

export const inputConfig = defineInputConfig({
  apiKey: {
    type: 'secret',
    label: 'KnowS API Key',
    description: 'KnowS 平台的 API 密钥',
    required: true
  },
  // 其他业务参数...
  environment: {
    type: 'select',
    label: '环境',
    description: '选择 API 环境',
    list: [
      { label: '生产环境', value: 'production' },
      { label: '开发环境', value: 'development' }
    ],
    defaultValue: 'production'
  }
});
```

#### 🔑 关键要点
- **API Key 必须为 secret 类型且必填**
- **统一的参数命名规范（驼峰命名）**
- **提供清晰的标签和描述**
- **合理的默认值设置**

### 3. 类型定义规范

#### ✅ 输入类型定义
```typescript
// 使用 Zod 进行类型验证
export const InputType = z.object({
  apiKey: z.string().describe('API密钥'),
  businessParam: z.string().describe('业务参数'),
  environment: z.enum(['production', 'development']).optional().describe('环境配置')
});

export type InputType = z.infer<typeof InputType>;
```

#### ✅ 输出类型定义
```typescript
export const OutputType = z.object({
  success: z.boolean().describe('执行状态'),
  data: z.any().describe('返回数据'),
  message: z.string().describe('结果消息'),
  error: z.string().optional().describe('错误信息')
});
```

#### 🔑 命名规范
- **统一使用驼峰命名**: `analysisType`, `evidenceId`, `questionId`
- **避免下划线命名**: ~~`analysis_type`~~, ~~`evidence_id`~~
- **保持输入类型与配置定义一致**

### 4. 核心实现 (children/*/src/index.ts)

#### ✅ 标准实现模式
```typescript
export async function tool(input: InputType): Promise<OutputType> {
  try {
    // 1. 参数解构（使用驼峰命名）
    const { apiKey, businessParam, environment = 'production' } = input;

    // 2. 输入验证
    const validation = validateInput(input);
    if (!validation.valid) {
      return createErrorOutput(validation.error!);
    }

    // 3. 获取配置
    const config = getKnowsConfig(apiKey, environment);

    // 4. 配置验证
    const configValidation = validateConfig(config);
    if (!configValidation.valid) {
      return createErrorOutput(`配置错误: ${configValidation.error}`);
    }

    // 5. 创建 API 客户端
    const client = createKnowsClient(config);

    // 6. 业务逻辑处理
    const result = await processBusinessLogic(client, input);

    // 7. 返回成功结果
    return createSuccessOutput(result, '操作成功');

  } catch (error) {
    // 8. 错误处理
    return handleError(error);
  }
}
```

#### 🔑 关键要点
- **参数名称与类型定义保持一致**
- **完整的错误处理机制**
- **统一的返回格式**
- **详细的日志记录**

### 5. 错误处理最佳实践

#### ✅ 分层错误处理
```typescript
function handleError(error: any): OutputType {
  console.error('[Tool] 执行失败:', error);
  
  let errorMessage = '操作失败';
  
  if (error instanceof Error) {
    // API 相关错误
    if (error.message.includes('invalid credential')) {
      errorMessage = 'API 密钥无效，请检查您的 API Key';
    } else if (error.message.includes('timeout')) {
      errorMessage = '请求超时，请稍后重试';
    } else if (error.message.includes('404')) {
      errorMessage = '资源不存在，请检查参数';
    } else {
      errorMessage = `操作失败: ${error.message}`;
    }
  }
  
  return createErrorOutput(errorMessage);
}
```

## 🚨 常见陷阱与解决方案

### 1. TypeScript 类型错误

#### 问题
- 参数命名不一致（驼峰 vs 下划线）
- 类型定义与实际使用不匹配
- API Key 可选性问题

#### 解决方案
```bash
# 定期运行类型检查
npx tsc --noEmit --skipLibCheck

# 统一命名规范
- 配置定义: apiKey (驼峰)
- 类型定义: apiKey (驼峰)  
- 函数使用: input.apiKey (驼峰)
```

### 2. 安全性问题

#### ❌ 错误做法
```typescript
// 不要提供默认 API Key
const DEFAULT_CONFIG = { apiKey: 'default-key' };

// 不要在代码中硬编码密钥
const config = getConfig('hardcoded-api-key');
```

#### ✅ 正确做法
```typescript
// 强制要求用户提供 API Key
export function getConfig(apiKey: string) {
  if (!apiKey) {
    throw new Error('API Key is required');
  }
  // ...
}
```

### 3. 配置管理复杂化

#### ❌ 避免过度设计
- 复杂的全局配置管理
- 多层配置继承
- 过多的环境变量依赖

#### ✅ 简化原则
- 每个子工具直接接收 API Key
- 最小化配置依赖
- 清晰的参数传递

## 📝 开发流程

### 1. 规划阶段
- [ ] 确定工具集功能范围
- [ ] 设计 shared 模块结构
- [ ] 规划子工具列表

### 2. 基础搭建
- [ ] 创建项目结构
- [ ] 实现 shared 模块
- [ ] 配置类型定义

### 3. 子工具开发
- [ ] 按优先级逐个开发子工具
- [ ] 统一配置格式
- [ ] 实现核心功能

### 4. 测试验证
- [ ] TypeScript 类型检查
- [ ] 功能测试
- [ ] 错误场景测试

### 5. 文档完善
- [ ] API 文档
- [ ] 使用示例
- [ ] 开发日志

## 🛠️ 开发工具

### TypeScript 检查
```bash
# 检查语法错误
npx tsc --noEmit --skipLibCheck

# 检查特定目录
npx tsc --noEmit --skipLibCheck modules/tool/packages/toolset-name/**/*.ts
```

### 代码规范
```bash
# 格式化代码
npx prettier --write "modules/tool/packages/toolset-name/**/*.{ts,js,json}"

# ESLint 检查
npx eslint "modules/tool/packages/toolset-name/**/*.ts"
```

## 📚 参考资源

### 成功案例
- **KnowS 工具集**: `/modules/tool/packages/knows/`
- **配置模板**: `/AI_coding_templates/ToolSet_Config_Template.md`

### 相关文档
- **插件开发指南**: `/PLUGIN_DEVELOPMENT_GUIDE.md`
- **AI 编程指南**: `/AI_coding_templates/AI_coding_guide.md`
- **类型定义**: `/AI_coding_templates/samples/common/types/`

## 🎯 总结

Children 结构工具集开发的核心是：

1. **安全第一**: 强制 API Key，无默认配置
2. **类型安全**: 统一命名，严格类型检查
3. **结构清晰**: 合理的模块划分和职责分离
4. **错误友好**: 完善的错误处理和用户提示
5. **文档完整**: 详细的开发记录和使用说明

遵循这些原则，可以大大减少开发过程中的问题，提高代码质量和维护性。