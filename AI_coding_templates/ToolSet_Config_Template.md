# ToolSet 配置模板

## 🎯 ToolSet 配置完整模板

### 主配置文件 (config.ts)
```typescript
import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';
// 导入所有子工具
import subTool1 from './children/subTool1';
import subTool2 from './children/subTool2';
import subTool3 from './children/subTool3';

/**
 * 工具集配置
 * 采用 children 架构组织多个子工具
 */
export default defineToolSet({
  name: {
    'zh-CN': '工具集名称',
    en: 'Tool Set Name'
  },
  description: {
    'zh-CN': '工具集描述',
    en: 'Tool Set Description'
  },
  type: ToolTypeEnum.tools,  // 或其他合适的类型
  icon: 'core/app/toolCall',
  author: 'FastGPT',
  children: [subTool1, subTool2, subTool3]  // 必须包含所有子工具
});
```

### 子工具配置文件 (children/subTool/index.ts)
```typescript
import config from './config';
import { InputType, OutputType, tool as toolCb } from './src';
import { exportTool } from '@tool/utils/tool';

/**
 * 子工具导出
 * 必须使用 exportTool 函数
 */
export default exportTool({
  toolCb,
  InputType,
  OutputType,
  config
});
```

### 子工具配置 (children/subTool/config.ts)
```typescript
import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  WorkflowIOValueTypeEnum,
  SystemInputKeyEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  type: ToolTypeEnum.tools,
  name: {
    'zh-CN': '子工具名称',
    en: 'Sub Tool Name'
  },
  description: {
    'zh-CN': '子工具描述',
    en: 'Sub Tool Description'
  },
  icon: 'core/workflow/template/toolIcon',
  author: 'FastGPT',
  versionList: [
    {
      value: '1.0.0',
      description: 'Initial version',
      inputs: [
        {
          key: SystemInputKeyEnum.systemInputConfig,
          label: '',
          inputList: [
            {
              key: 'apiKey',
              label: 'API密钥',
              description: 'API密钥配置',
              required: true,
              inputType: 'secret'
            }
          ],
          renderTypeList: [FlowNodeInputTypeEnum.hidden],
          valueType: WorkflowIOValueTypeEnum.object
        },
        {
          key: 'query',
          label: '查询内容',
          description: '输入查询内容',
          toolDescription: '查询参数',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input]
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '结果',
          description: '处理结果',
          valueType: WorkflowIOValueTypeEnum.string
        }
      ]
    }
  ]
});
```

### 子工具实现 (children/subTool/src/index.ts)
```typescript
import { z } from 'zod';

// 输入类型定义
export const InputType = z.object({
  query: z.string().min(1, '查询内容不能为空'),
  apiKey: z.string().optional()
});

// 输出类型定义
export const OutputType = z.object({
  result: z.string()
});

// 工具实现函数
export async function tool(
  input: z.infer<typeof InputType>
): Promise<z.infer<typeof OutputType>> {
  try {
    // 实现具体逻辑
    const result = await processQuery(input.query);
    
    return {
      result: result
    };
  } catch (error) {
    throw new Error(`处理失败: ${error.message}`);
  }
}

// 辅助函数
async function processQuery(query: string): Promise<string> {
  // 具体实现逻辑
  return `处理结果: ${query}`;
}
```

## 🚨 关键检查点

### 1. 主配置文件检查
- [ ] 导入了所有子工具
- [ ] children 数组包含所有子工具
- [ ] 使用了正确的 defineToolSet 函数

### 2. 子工具导出检查
- [ ] 使用了 exportTool 函数
- [ ] 导入路径正确 (`'./src'` 而不是 `'./src/index'`)
- [ ] 包含了所有必需的导出项

### 3. 构建验证
- [ ] 运行 `npm run build` 无错误
- [ ] 生成的 .js 文件存在于 dist/tools/ 目录
- [ ] FastGPT 中可以正常显示插件

## ❌ 常见错误

### 错误1：缺少 children 数组
```typescript
// ❌ 错误
export default defineToolSet({
  name: { 'zh-CN': '工具集' },
  // 缺少 children 数组
});

// ✅ 正确
export default defineToolSet({
  name: { 'zh-CN': '工具集' },
  children: [subTool1, subTool2]
});
```

### 错误2：子工具导出结构错误
```typescript
// ❌ 错误
export default {
  InputType,
  OutputType,
  toolCb,
  config
};

// ✅ 正确
export default exportTool({
  toolCb,
  InputType,
  OutputType,
  config
});
```

### 错误3：导入路径错误
```typescript
// ❌ 错误
import { tool as toolCb } from './src/index';

// ✅ 正确
import { tool as toolCb } from './src';
```

## 🎯 成功标准

一个 ToolSet 配置成功的标准：
1. **构建成功**：`npm run build` 无错误
2. **文件生成**：dist/tools/ 目录下生成对应的 .js 文件
3. **插件显示**：FastGPT 中可以正常显示和使用插件
4. **无运行时错误**：不出现 "Cannot read properties of undefined" 错误

遵循这个模板，可以避免 99% 的 ToolSet 配置错误！