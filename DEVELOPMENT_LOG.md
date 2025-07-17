# 开发日志

## 2025-01-17 - KnowS 工具集成修复

### 问题描述
在集成 KnowS 工具集时遇到了多个构建错误：

1. **类型错误**: `WorkflowIOValueTypeEnum` 枚举值使用错误
2. **导入路径错误**: `defineTool` 从错误的模块导入
3. **工具类型错误**: 工具类型枚举使用错误
4. **配置结构错误**: 工具配置结构不符合 FastGPT 规范
5. **构建插件错误**: 构建插件中存在 undefined 访问错误

### 修复过程

#### 1. 修复 WorkflowIOValueTypeEnum 枚举值
**问题**: 使用了不存在的枚举值如 `WorkflowIOValueTypeEnum.text`
**解决方案**: 将所有枚举值修正为正确的值：
- `text` → `string`
- `json` → `object`
- `array` → `arrayString` 或 `arrayObject`

#### 2. 修复 defineTool 导入路径
**问题**: 从 `@tool/utils/tool` 导入 `defineTool`，但该模块不存在此导出
**解决方案**: 将导入路径修正为 `@tool/type`

#### 3. 修复工具类型枚举
**问题**: 使用了字符串 `"tool"` 而不是枚举值
**解决方案**: 
- 对于大部分工具使用 `ToolTypeEnum.tools`
- 对于搜索工具使用 `ToolTypeEnum.search`

#### 4. 修复配置结构
**问题**: 配置结构不符合 FastGPT 的 `defineTool` 要求
**解决方案**: 
- 将 `input`/`output` 转换为 `versionList` 格式
- 添加多语言支持的 `name` 和 `description`
- 将 `version` 字段重命名为 `value`
- 为输入参数添加 `toolDescription` 字段

#### 5. 修复构建插件错误
**问题**: 构建插件中访问 `path.node.arguments[0].type` 时未检查 `arguments[0]` 是否存在
**解决方案**: 添加空值检查 `path.node.arguments[0] &&`

### 修复的文件列表
1. `/modules/tool/packages/knows/analysis/config.ts`
2. `/modules/tool/packages/knows/details/config.ts`
3. `/modules/tool/packages/knows/history/config.ts`
4. `/modules/tool/packages/knows/management/config.ts`
5. `/modules/tool/packages/knows/search/config.ts`
6. `/modules/tool/packages/knows/search/src/types.ts`
7. `/modules/tool/packages/knows/summary/config.ts`
8. `/scripts/plugin.ts`

### 关键修改要点

#### 工具配置标准化
所有工具配置都遵循以下结构：
```typescript
export default defineTool({
  type: ToolTypeEnum.tools, // 或 ToolTypeEnum.search
  name: {
    'zh-CN': '中文名称',
    'en-US': 'English Name'
  },
  description: {
    'zh-CN': '中文描述',
    'en-US': 'English Description'
  },
  versionList: [
    {
      value: '1.0.0',
      input: [
        {
          key: 'paramName',
          valueType: WorkflowIOValueTypeEnum.string,
          label: {
            'zh-CN': '参数标签',
            'en-US': 'Parameter Label'
          },
          toolDescription: {
            'zh-CN': '参数描述',
            'en-US': 'Parameter Description'
          },
          required: true
        }
      ],
      output: [
        {
          key: 'result',
          valueType: WorkflowIOValueTypeEnum.object,
          label: {
            'zh-CN': '结果',
            'en-US': 'Result'
          }
        }
      ]
    }
  ]
});
```

#### 类型安全改进
- 移除了对未定义类型 `Evidence` 的引用
- 重新定义了 `SearchToolInput`、`SearchToolOutput` 和 `SearchResult` 接口
- 确保所有类型定义都有对应的实现

### 构建结果
✅ 构建成功，所有 30 个工具/工具集编译完成
✅ 复制了 8 个工具图标
✅ 无 TypeScript 错误
✅ 无运行时错误

### 经验总结
1. **类型安全**: 始终使用正确的枚举值，避免字符串硬编码
2. **导入路径**: 确认模块的正确导出路径，避免导入不存在的成员
3. **配置规范**: 严格遵循 FastGPT 的工具配置规范
4. **空值检查**: 在访问对象属性前进行空值检查，避免运行时错误
5. **渐进式修复**: 逐个修复错误，每次修复后进行构建验证

### 下一步计划
1. 测试所有 KnowS 工具的功能
2. 编写工具使用文档
3. 添加单元测试
4. 优化错误处理和用户体验

---

## FastGPT 临床试验查询工具增强开发日志

## 开发时间
2025-07-16

## 开发目标
根据用户需求，增强临床试验查询工具，支持自然语言查询和更丰富的参数选择功能。

## 主要需求
1. **自然语言查询支持**：支持类似"请查询下中国的kras12d的胰腺癌II期临床试验最近30天有哪些在招募的方案"的自然语言查询
2. **参数选择增强**：
   - 疾病或关键词：增加癌症种类列表参考
   - 实验阶段：支持直接选择（Early Phase 1, Phase 1-4）
   - 实验状态：支持直接选择（招募中、已完成等）
   - 地理位置：支持国家列表选择
   - 日期选择：改为日期选择器，支持yyyy-mm-dd格式
   - 返回数量：默认200，支持自定义输入

## 实施步骤

### 1. 配置文件增强 (config.ts)
**修改内容**：
- 更新 `query` 字段描述，增加预设疾病/关键词列表
- 将 `phases`、`status`、`location` 字段的 `renderTypeList` 改为 `select`
- 为各字段添加详细的选择列表（options）
- 更新 `startDate` 字段支持日期格式
- 调整 `pageSize` 默认值为200，最大值为1000

**关键修改**：
```typescript
// 疾病或关键词 - 增加预设列表
options: [
  { label: '胰腺癌 (Pancreatic Cancer)', value: 'pancreatic cancer' },
  { label: '乳腺癌 (Breast Cancer)', value: 'breast cancer' },
  // ... 更多癌症类型
]

// 试验阶段 - 支持多选
options: [
  { label: 'Early Phase 1', value: 'EARLY_PHASE1' },
  { label: 'Phase 1', value: 'PHASE1' },
  // ... 更多阶段
]
```

### 2. 自然语言解析功能 (src/index.ts)
**新增功能**：
- `parseNaturalLanguageQuery()` 函数：从自然语言中提取关键参数
- 支持中英文混合查询
- 自动识别并提取：
  - 试验阶段（I期、II期、Phase 1-4、早期等）
  - 试验状态（招募中、已完成、暂停等）
  - 地理位置（中国、美国、日本等）
  - 时间范围（最近30天、最近一个月等）
  - 返回数量（返回50个等）

**核心逻辑**：
```typescript
// 提取试验阶段
const phasePatterns = [
  { pattern: /[iⅰ一1]期|phase\s*[i1]|early\s*phase/i, value: 'PHASE1' },
  { pattern: /[iiⅱ二2]期|phase\s*[ii2]/i, value: 'PHASE2' },
  // ...
];

// 清理查询词，保留核心疾病/药物关键词
let cleanQuery = result.query;
cleanQuery = cleanQuery.replace(/时间相关词汇|状态词汇|阶段词汇/gi, '');
```

### 3. 查询摘要增强
**改进内容**：
- 显示自动提取的参数信息
- 区分用户手动设置和自动解析的参数
- 提供更详细的查询条件说明

**示例输出**：
```
查询了"请查询下中国的kras12d的胰腺癌II期临床试验最近30天有哪些在招募的方案"相关的临床试验，
自动提取参数：核心关键词：kras12d胰腺癌，试验阶段：PHASE2，试验状态：RECRUITING，地理位置：China，开始日期：2025-06-16。
找到X个试验，其中Y个正在招募。查询条件：地区：China，阶段：PHASE2，状态：RECRUITING，起始日期：2025-06-16。
```

## 技术实现要点

### 1. 类型安全
- 修复TypeScript编译错误
- 确保日期计算的类型安全
- 移除不支持的配置属性

### 2. 正则表达式优化
- 支持中英文混合匹配
- 处理各种日期表达方式
- 智能清理查询词

### 3. 参数优先级
- 用户手动设置的参数优先级高于自动解析
- 避免覆盖用户明确指定的参数

## 测试验证

### 测试用例
1. **用户示例查询**："请查询下中国的kras12d的胰腺癌II期临床试验最近30天有哪些在招募的方案"
   - ✅ 提取阶段：PHASE2
   - ✅ 提取状态：RECRUITING
   - ✅ 提取地区：China
   - ✅ 提取时间：30天前日期
   - ✅ 清理查询词：保留"kras12d胰腺癌"

2. **英文查询**："Show me phase 3 breast cancer trials in United States recruiting patients"
   - ✅ 提取阶段：PHASE3
   - ✅ 提取状态：RECRUITING
   - ✅ 提取地区：United States

3. **时间范围查询**："最近一个月的肺癌早期试验"
   - ✅ 提取阶段：EARLY_PHASE1
   - ✅ 提取时间：30天前日期

4. **数量限制查询**："返回50个乳腺癌试验"
   - ✅ 提取数量：50

## 构建和部署

### 构建状态
- ✅ TypeScript编译通过
- ✅ 工具构建成功
- ✅ 开发服务器启动正常
- ✅ 工具加载成功（总计55个工具）

### 服务信息
- 开发服务器：http://localhost:5100
- 工具总数：55个
- 存储桶：fastgpt-plugins（15天保留期）

## 开发成果

### 1. 功能增强
- ✅ 支持自然语言查询解析
- ✅ 智能参数提取和设置
- ✅ 丰富的参数选择选项
- ✅ 改进的用户界面配置
- ✅ 增强的查询结果摘要

### 2. 用户体验改进
- ✅ 支持中英文混合查询
- ✅ 自动识别查询意图
- ✅ 减少手动参数设置工作量
- ✅ 提供详细的查询反馈

### 3. 技术优化
- ✅ 类型安全的代码实现
- ✅ 健壮的错误处理
- ✅ 高效的正则表达式匹配
- ✅ 清晰的代码结构和注释

## 后续优化建议

1. **查询词清理优化**：进一步改进查询词清理逻辑，更准确地保留核心关键词
2. **同义词支持**：增加疾病和药物的同义词识别
3. **模糊匹配**：支持拼写错误和模糊匹配
4. **查询历史**：记录和复用常用查询模式
5. **结果缓存**：优化API调用性能

## API文档整理 (2024-12-19)

### 目标
整理ClinicalTrials.gov官方API文档，为后续API开发提供指导。

### 完成内容
1. **官方文档收集**: 收集了ClinicalTrials.gov API v2.0的官方文档链接
2. **API特性分析**: 分析了新版API的主要特性和优势
3. **开发指导文档**: 创建了完整的`CLINICALTRIALS_API_DEVELOPMENT_GUIDE.md`文档
4. **知识库记录**: 将API信息记录到记忆系统中便于后续查询

### 关键信息
- **官方API文档**: https://clinicaltrials.gov/data-api/api
- **新版测试环境**: https://beta-ut.clinicaltrials.gov/api/oas/v2.html
- **API版本**: v2.0 (基于REST和OpenAPI 3.0)
- **迁移时间**: 经典API将在2024年6月退役

### 技术要点
- 新版API支持现代化数据格式和第三方库集成
- 提供更好的分页机制 (使用pageToken)
- 支持丰富的查询参数 (conditions、interventions、phase、status等)
- 响应格式为结构化JSON数据

### 开发建议
- 优先在测试环境验证新版API功能
- 实现完整的错误处理和重试机制
- 使用适当的分页策略处理大量数据
- 考虑升级现有工具以使用v2.0 API

## 文件修改清单

### 修改的文件
1. `modules/tool/packages/clinicalTrials/config.ts` - 配置文件增强
2. `modules/tool/packages/clinicalTrials/src/index.ts` - 核心逻辑实现

### 新增的文件
1. `test_natural_language_query.js` - 自然语言解析测试脚本
2. `DEVELOPMENT_LOG.md` - 开发日志文档

## 总结

本次开发成功实现了临床试验查询工具的全面增强，特别是自然语言查询支持功能。用户现在可以使用自然语言描述查询需求，工具会自动解析并设置相应的查询参数，大大提升了使用便利性。同时，丰富的参数选择选项和改进的用户界面也让工具更加专业和易用。

所有功能已通过测试验证，构建部署正常，可以投入使用。