# AI 开发初始模板

## 🚨 开发顺序要求（必须严格遵守）

### 核心原则
**⚠️ 先开发一个子功能，确保代码完全正确后，再快速开发其他功能**

### 开发流程
1. **选择最简单的功能**：从最基础的子工具开始
2. **完整实现**：包括 config.ts、types.ts、index.ts 所有文件
3. **验证正确性**：
   - 运行 `npm run build` 确保构建成功
   - 检查类型定义无错误
   - 验证配置结构正确
4. **功能测试**：确保该子工具功能正常
5. **模板复制**：基于正确的代码模板开发其他功能
6. **避免全量开发**：禁止同时开发多个功能

### 错误示例 vs 正确示例
```
❌ 错误流程：
开发工具A + 工具B + 工具C → 发现错误 → 修改A、B、C → 重复5次

✅ 正确流程：
开发工具A → 验证正确 → 复制A的模板开发B → 复制A的模板开发C
```

## 🐛 错误预防检查清单

### TypeScript 类型检查
- [ ] 所有引用的类型都已定义
- [ ] 导入路径正确
- [ ] 导出的成员名称正确
- [ ] 没有使用 `any` 类型

### FastGPT 配置检查
- [ ] 使用正确的 `ToolTypeEnum` 枚举值
- [ ] 配置对象属性名正确（如 `value` 而不是 `version`）
- [ ] 输入参数包含所有必需属性（如 `toolDescription`）
- [ ] 支持多语言配置

### 代码规范检查
- [ ] 所有标点符号使用半角字符
- [ ] 没有全角字符导致的语法错误
- [ ] 对象属性访问前进行存在性检查
- [ ] 错误处理完善

### 构建验证
- [ ] `npm run build` 构建成功
- [ ] 没有 TypeScript 编译错误
- [ ] 没有构建插件错误

## 📝 开发模板结构

### 基础文件模板

#### config.ts 模板
```typescript
import { defineTool } from '@tool/utils';
import { ToolTypeEnum } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export const config = defineTool({
  type: ToolTypeEnum.tools,  // 使用正确的枚举值
  name: {
    'zh-CN': '工具名称',
    'en-US': 'Tool Name'
  },
  description: {
    'zh-CN': '工具描述',
    'en-US': 'Tool Description'
  },
  versionList: [
    {
      value: '1.0.0',  // 使用 value 而不是 version
      // 其他配置...
    }
  ]
});
```

#### types.ts 模板
```typescript
// 输入类型定义
export interface ToolInput {
  query: string;
  // 其他输入参数...
}

// 输出类型定义
export interface ToolOutput {
  result: string;
  // 其他输出参数...
}

// 内部使用的类型
export interface InternalType {
  id: string;
  data: any;
}
```

#### index.ts 模板
```typescript
import type { ToolInput, ToolOutput } from './types';

export default async function handler(input: ToolInput): Promise<ToolOutput> {
  try {
    // 输入验证
    if (!input.query?.trim()) {
      throw new Error('查询内容不能为空');
    }

    // 业务逻辑
    const result = await processQuery(input.query);
    
    return {
      result: result.data
    };
  } catch (error) {
    console.error('处理失败:', error);
    throw new Error(
      error instanceof Error 
        ? `处理失败: ${error.message}`
        : '未知错误，请稍后重试'
    );
  }
}

async function processQuery(query: string): Promise<{ data: string }> {
  // 具体实现逻辑
  return { data: `处理结果: ${query}` };
}
```

## 🔍 常见错误检查

### 1. ToolSet 配置错误检查
```typescript
// 检查点1：主配置文件必须包含 children 数组
import { defineToolSet } from '@tool/type';
import subTool1 from './children/subTool1';
import subTool2 from './children/subTool2';

export default defineToolSet({
  // ... 其他配置
  children: [subTool1, subTool2]  // ✅ 必须包含
});

// 检查点2：子工具必须使用 exportTool 函数
import { exportTool } from '@tool/utils/tool';

export default exportTool({  // ✅ 使用 exportTool
  toolCb,
  InputType,
  OutputType,
  config
});
```

### 2. 类型错误检查
```typescript
// ❌ 错误：使用未定义类型
export interface Output {
  data: UndefinedType[];
}

// ✅ 正确：使用已定义类型
export interface Output {
  data: DefinedType[];
}

export interface DefinedType {
  id: string;
  name: string;
}
```

### 2. 配置错误检查
```typescript
// ❌ 错误：使用错误的枚举值
type: 'tool',

// ✅ 正确：使用正确的枚举值
type: ToolTypeEnum.tools,
```

### 3. 字符编码检查
```typescript
// ❌ 错误：全角字符
const config = {
  name: '工具'，  // 全角逗号
};

// ✅ 正确：半角字符
const config = {
  name: '工具',  // 半角逗号
};
```

## 📋 开发检查清单

### 开发前
- [ ] 确定要开发的单一功能
- [ ] 准备好正确的模板代码
- [ ] 了解相关的类型定义

### 开发中
- [ ] 严格按照模板结构编写代码
- [ ] 确保所有类型都正确定义
- [ ] 使用半角字符编写代码
- [ ] 添加必要的错误处理
- [ ] **ToolSet 配置检查**：
  - [ ] 主配置文件包含 children 数组
  - [ ] 所有子工具使用 exportTool 函数导出
  - [ ] 导入路径正确（'./src' 而不是 './src/index'）

### 开发后
- [ ] 运行 `npm run build` 验证构建
- [ ] 检查是否有 TypeScript 错误
- [ ] 验证功能是否正常
- [ ] 确认可以作为其他功能的模板
- [ ] **关键错误检查**：
  - [ ] 无 "Cannot read properties of undefined" 错误
  - [ ] 插件在 FastGPT 中正常显示

### 扩展开发
- [ ] 基于验证正确的代码进行复制
- [ ] 只修改必要的业务逻辑部分
- [ ] 保持配置结构的一致性
- [ ] 重复验证流程

## 🎯 成功标准

一个功能开发完成的标准：
1. **构建成功**：`npm run build` 无错误
2. **类型正确**：所有 TypeScript 类型检查通过
3. **配置正确**：FastGPT 配置结构符合要求
4. **功能正常**：基本功能可以正常运行
5. **可复制性**：代码结构清晰，可作为其他功能的模板

只有满足以上所有标准，才能开始开发下一个功能。

# FastGPT 插件开发指南

## 🎯 快速开始

本指南专注于 FastGPT {Clinicaltrials} 插件的实际开发工作，包含代码模板、开发流程和最佳实践。

## FEATURE:


### 🔍 智能查询解析
- **自然语言支持**：支持中英文自然语言查询（如"KRAS基因相关的临床试验"）
- **智能参数提取**：自动识别试验阶段、状态、地理位置、时间范围等筛选条件
- **灵活查询格式**：支持基因名称、疾病名称、药物名称等多种查询方式
- **基因查询优化**：针对KRAS、BRCA1等基因名称进行了专门优化

### 📊 结构化输出
工具提供三层结构化输出：

1. **概述部分**：查询摘要和关键统计信息
2. **统计分析**：
   - 试验阶段分布（Phase I/II/III/IV）
   - 试验状态统计（招募中、已完成、暂停等）
   - 地理分布分析
3. **详细信息**：每个试验的完整信息，包括：
   - 试验标题和描述
   - 主要/次要终点
   - 入组标准
   - 联系方式和地点
   - ClinicalTrials.gov链接

### 🎯 高级筛选
- **试验阶段**：Phase I, II, III, IV, Early Phase 1
- **试验状态**：招募中、即将开始、已完成、暂停、终止等
- **地理位置**：支持国家、州/省、城市级别筛选
- **时间范围**：支持开始日期和完成日期筛选
- **结果数量**：可自定义返回结果数量


## EXAMPLES:

/Users/qinxiaoqiang/Downloads/fastgpt-plugin-1/modules/tool/packages/clinicalTrials


## 📖 DOCUMENTATION - 开发资源:

### 🔗 核心文档
- **FastGPT插件开发指南**: `/PLUGIN_DEVELOPMENT_GUIDE.md` - 完整的开发流程和最佳实践
- **开发规范**: `/dev_zh_CN.md` - 代码规范和开发习惯
- **贡献指南**: `/CONTRIBUTING.md` - 如何参与项目贡献
- **AI编程指南**: `/AI_coding_templates/AI_coding_guide.md` - AI辅助开发框架
- **专家提示词**: `/AI_coding_templates/developer_prompt.md` - 开发专家助手

### 🌐 官方API文档 (以临床试验为例)
- **ClinicalTrials.gov API**: https://clinicaltrials.gov/api/ <mcreference link="https://docs.dify.ai/zh-hans/plugins/introduction" index="3">3</mcreference>
- **新版API测试环境**: https://beta-ut.clinicaltrials.gov/api/oas/v2.html
- **API迁移指南**: https://clinicaltrials.gov/data-api/about-api/api-migration

### 🛠️ 开发工具与框架
- **Vitest测试框架**: https://vitest.dev - 单元测试和集成测试
- **Zod验证库**: https://zod.dev - 类型安全的数据验证
- **TypeScript**: https://www.typescriptlang.org - 类型安全的JavaScript

### 📚 参考生态
- **Dify插件系统**: https://docs.dify.ai/zh-hans/plugins/introduction <mcreference link="https://docs.dify.ai/zh-hans/plugins/introduction" index="3">3</mcreference>
- **Dify Marketplace**: https://marketplace.dify.ai/ <mcreference link="https://github.com/langgenius/dify-plugins" index="2">2</mcreference>
- **插件开发模板**: `/scripts/newTool/template/` - 官方提供的插件模板

## 🔧 开发模板与代码示例:

### 📁 标准插件结构
```
plugin-name/
├── config.ts          # 插件配置和UI定义
├── index.ts           # 导出入口
├── package.json       # 依赖管理
├── src/
│   └── index.ts       # 核心实现逻辑
└── test/
    └── index.test.ts  # 测试文件
```

### 🎯 1. 简单工具类模板 (参考 `delay`)
```typescript
// config.ts - 配置定义
import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  type: ToolTypeEnum.tools,
  name: { 'zh-CN': '工具名称', en: 'Tool Name' },
  description: { 'zh-CN': '工具描述', en: 'Tool Description' },
  icon: 'core/workflow/template/sleep',
  versionList: [{
    value: '1.0',
    description: 'Default version',
    inputs: [
      {
        key: 'input_param',
        label: '输入参数',
        renderTypeList: [FlowNodeInputTypeEnum.numberInput],
        valueType: WorkflowIOValueTypeEnum.number,
        defaultValue: 1000
      }
    ],
    outputs: [
      {
        key: 'result',
        label: '结果',
        valueType: WorkflowIOValueTypeEnum.string
      }
    ]
  }]
});

// src/index.ts - 核心逻辑
import { z } from 'zod';

export const InputType = z.object({
  input_param: z.number().min(1).max(300000).optional()
});

export const OutputType = z.object({
  result: z.string()
});

export async function tool({ input_param }: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  // 实现核心逻辑
  return { result: `处理结果: ${input_param}` };
}
```

### 🌐 2. API集成类模板 (参考 `clinicalTrials`)
```typescript
// src/index.ts - API集成示例
import { z } from 'zod';

const API_BASE_URL = 'https://api.example.com';

export const InputType = z.object({
  query: z.string().min(1, '查询关键词不能为空'),
  limit: z.number().min(1).max(100).optional().default(10)
});

export const OutputType = z.object({
  result: z.string(),
  totalCount: z.number(),
  summary: z.string()
});

// API调用函数
async function callExternalAPI(params: URLSearchParams): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/search?${params}`);
  if (!response.ok) {
    throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// 数据格式化函数
function formatResults(data: any[]): string {
  return data.map(item => `- ${item.title}: ${item.description}`).join('\n');
}

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    // 构建查询参数
    const params = new URLSearchParams({
      q: props.query,
      limit: props.limit?.toString() || '10'
    });

    // 调用API
    const apiResponse = await callExternalAPI(params);
    
    // 处理响应数据
    const formattedResult = formatResults(apiResponse.data || []);
    
    return {
      result: formattedResult,
      totalCount: apiResponse.total || 0,
      summary: `查询"${props.query}"共找到${apiResponse.total || 0}条结果`
    };
  } catch (error) {
    console.error('API调用错误:', error);
    throw new Error(`查询失败: ${error.message}`);
  }
}
```

### 🧪 3. 测试模板
```typescript
// test/index.test.ts - 测试示例
import { expect, test, vi } from 'vitest';
import { tool, InputType, OutputType } from '../src';

// Mock外部API
global.fetch = vi.fn();

test('基本功能测试', async () => {
  // Mock API响应
  const mockResponse = {
    data: [{ title: '测试标题', description: '测试描述' }],
    total: 1
  };
  
  (fetch as any).mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse
  });

  // 测试输入验证
  const validInput = { query: '测试查询', limit: 5 };
  const parsedInput = InputType.parse(validInput);
  
  // 执行工具函数
  const result = await tool(parsedInput);
  
  // 验证输出
  expect(result).toBeDefined();
  expect(result.totalCount).toBe(1);
  expect(result.result).toContain('测试标题');
  expect(OutputType.parse(result)).toBeDefined();
});

test('错误处理测试', async () => {
  // Mock API错误
  (fetch as any).mockRejectedValueOnce(new Error('网络错误'));
  
  const input = { query: '测试查询' };
  
  // 验证错误处理
  await expect(tool(input)).rejects.toThrow('查询失败');
});

test('输入验证测试', () => {
  // 测试无效输入
  expect(() => InputType.parse({ query: '' })).toThrow();
  expect(() => InputType.parse({ query: 'valid', limit: -1 })).toThrow();
  
  // 测试有效输入
  expect(InputType.parse({ query: 'valid' })).toBeDefined();
});
```

## ⚠️ OTHER CONSIDERATIONS - 开发注意事项:

### 🚨 常见陷阱与解决方案

#### 1. **API调用问题**
- **超时处理**: 设置合理的请求超时时间 (建议30秒)
- **重试机制**: 实现指数退避重试策略
- **错误处理**: 提供用户友好的错误信息
- **限流处理**: 遵守API调用频率限制

#### 2. **数据验证与安全**
- **输入验证**: 使用Zod进行严格的类型检查
- **SQL注入**: 数据库查询使用参数化查询
- **XSS防护**: 对用户输入进行适当转义
- **敏感信息**: 避免在日志中记录敏感数据

#### 3. **性能优化**
- **缓存策略**: 合理使用缓存减少API调用
- **批量处理**: 支持批量操作提高效率
- **内存管理**: 避免内存泄漏，及时释放资源
- **异步处理**: 使用async/await处理异步操作

#### 4. **测试覆盖**
- **单元测试**: 覆盖核心逻辑和边界条件
- **集成测试**: 测试与外部API的集成
- **Mock测试**: 模拟外部依赖避免测试不稳定
- **性能测试**: 验证在高负载下的表现

#### 5. **国际化支持**
- **多语言**: 支持中英文配置和错误信息
- **时区处理**: 正确处理不同时区的时间
- **本地化**: 适配不同地区的数据格式

#### 6. **版本管理**
- **向后兼容**: 新版本保持对旧版本的兼容
- **版本标记**: 使用语义化版本号
- **迁移指南**: 提供版本升级指导

### 💡 最佳实践建议

1. **先理解需求，再开始开发** - 仔细分析用户场景和数据流
2. **重要代码修改要添加详细注释** - 说明修改原因和实现思路  
3. **按照最佳开发实践避免重复试错** - 参考现有成功案例
4. **保持代码语法准确和层级清晰** - 使用TypeScript和ESLint
5. **及时记录开发过程和错误要点** - 维护开发日志
6. **使用Git进行版本管理** - 及时提交和推送代码
7. **避免全角字符导致的语法错误** - 所有代码使用半角字符

### 🔄 开发工作流

1. **需求分析** → 2. **技术调研** → 3. **架构设计** → 4. **编码实现** → 5. **测试验证** → 6. **文档编写** → 7. **部署发布**

每个阶段都要有明确的交付物和验收标准，确保开发质量和效率。
