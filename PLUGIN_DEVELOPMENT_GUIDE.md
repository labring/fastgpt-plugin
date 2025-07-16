# FastGPT 插件开发实战指南

本指南基于临床试验插件（ClinicalTrials）的实际开发经验，提供完整的插件开发流程和踩坑提醒。

## 📋 目录

- [开发前准备](#开发前准备)
- [插件架构设计](#插件架构设计)
- [核心开发步骤](#核心开发步骤)
- [API集成最佳实践](#api集成最佳实践)
- [测试与验证](#测试与验证)
- [性能优化](#性能优化)
- [文档编写](#文档编写)
- [踩坑提醒](#踩坑提醒)
- [发布流程](#发布流程)

## 🛠 开发前准备

### 1. 需求分析

在开始编码前，必须明确以下问题：

```markdown
## 需求分析清单
- [ ] 插件的核心功能是什么？
- [ ] 目标用户群体是谁？
- [ ] 需要集成哪些外部API？
- [ ] 输入输出数据格式是什么？
- [ ] 有哪些边界条件需要处理？
- [ ] 性能要求（响应时间、并发量）
- [ ] 错误处理策略
```

### 2. 技术调研

**以临床试验插件为例：**

```typescript
// 调研要点
1. API文档研究：ClinicalTrials.gov API
2. 数据结构分析：研究返回的JSON格式
3. 限流策略：了解API的调用限制
4. 认证方式：确认是否需要API Key
5. 错误码含义：理解各种错误情况
```

### 3. 环境搭建

```bash
# 确保开发环境完整
bun --version  # 检查包管理器
node --version # 检查Node.js版本
git --version  # 检查Git版本

# 启动开发服务器
bun run dev
```

## 🏗 插件架构设计

### 1. 目录结构规划

```
modules/tool/packages/your-plugin/
├── config.ts              # 插件配置文件
├── index.ts               # 插件入口文件
├── package.json           # 插件元信息
├── README.md              # 插件说明文档
└── src/
    ├── index.ts           # 核心业务逻辑
    ├── types.ts           # 类型定义
    ├── utils.ts           # 工具函数
    ├── api.ts             # API调用封装
    └── constants.ts       # 常量定义
```

### 2. 类型定义设计

```typescript
// src/types.ts - 完整的类型定义

// 输入参数类型
export interface ClinicalTrialsInput {
  condition: string;          // 疾病条件
  location?: string;          // 地理位置
  status?: string;           // 试验状态
  phase?: string;            // 试验阶段
  maxResults?: number;       // 最大结果数
}

// API响应类型
export interface ClinicalTrialStudy {
  nctId: string;             // 试验ID
  briefTitle: string;        // 简要标题
  officialTitle?: string;    // 官方标题
  overallStatus: string;     // 总体状态
  phase?: string[];          // 试验阶段
  studyType: string;         // 研究类型
  hasExpandedAccess?: boolean; // 扩展准入
  briefSummary?: string;     // 简要摘要
  detailedDescription?: string; // 详细描述
  conditions?: string[];     // 疾病条件
  interventions?: Intervention[]; // 干预措施
  locations?: Location[];    // 试验地点
  contacts?: Contact[];      // 联系信息
  eligibility?: Eligibility; // 入选标准
  dates?: StudyDates;        // 重要日期
}

// 输出结果类型
export interface ClinicalTrialsOutput {
  totalCount: number;        // 总数量
  studies: ClinicalTrialStudy[]; // 试验列表
  searchSummary: string;     // 搜索摘要
  hasMore: boolean;          // 是否有更多结果
}
```

### 3. 配置文件设计

```typescript
// config.ts - 插件配置
import type { PluginConfig } from '../../type';

export const config: PluginConfig = {
  id: 'clinicaltrials',
  name: '临床试验查询',
  description: '查询ClinicalTrials.gov数据库中的临床试验信息，支持按疾病、地点、状态等条件筛选',
  avatar: '/imgs/tools/clinicaltrials.svg',
  author: '开发者姓名',
  version: '1.0.0',
  documentUrl: 'https://doc.fastgpt.in/docs/development/custom-plugin/',
  isActive: true,
  // 重要：插件的唯一标识，避免冲突
  uniqueId: 'clinicaltrials-v1'
};
```

## 🔧 核心开发步骤

### 步骤1：定义输入输出接口

```typescript
// src/index.ts - 输入输出定义
import { PluginInputModule, PluginOutputModule } from '../../type';

// 输入参数定义
const pluginInput: PluginInputModule[] = [
  {
    key: 'condition',
    type: 'string',
    label: '疾病或条件',
    description: '要搜索的疾病名称或医学条件，如"糖尿病"、"癌症"等',
    required: true,
    placeholder: '请输入疾病名称，如：糖尿病'
  },
  {
    key: 'location',
    type: 'string',
    label: '地理位置',
    description: '试验进行的地点，可以是国家、州/省或城市',
    required: false,
    placeholder: '如：China, Beijing, 或留空查询所有地点'
  },
  {
    key: 'status',
    type: 'select',
    label: '试验状态',
    description: '临床试验的当前状态',
    required: false,
    list: [
      { label: '全部状态', value: '' },
      { label: '招募中', value: 'Recruiting' },
      { label: '未开始招募', value: 'Not yet recruiting' },
      { label: '已完成', value: 'Completed' },
      { label: '进行中', value: 'Active, not recruiting' }
    ]
  },
  {
    key: 'maxResults',
    type: 'number',
    label: '最大结果数',
    description: '返回的最大试验数量（1-100）',
    required: false,
    min: 1,
    max: 100,
    defaultValue: 10
  }
];

// 输出结果定义
const pluginOutput: PluginOutputModule[] = [
  {
    key: 'totalCount',
    type: 'number',
    label: '总数量',
    description: '符合条件的临床试验总数'
  },
  {
    key: 'studies',
    type: 'array',
    label: '试验列表',
    description: '临床试验详细信息列表'
  },
  {
    key: 'searchSummary',
    type: 'string',
    label: '搜索摘要',
    description: '搜索结果的文字摘要'
  }
];
```

### 步骤2：API调用封装

```typescript
// src/api.ts - API调用封装
import { ClinicalTrialsInput, ClinicalTrialStudy } from './types';

// API基础配置
const API_BASE_URL = 'https://clinicaltrials.gov/api/v2';
const DEFAULT_TIMEOUT = 30000; // 30秒超时

/**
 * 构建API查询参数
 * @param input 用户输入参数
 * @returns 格式化的查询参数
 */
function buildQueryParams(input: ClinicalTrialsInput): Record<string, string> {
  const params: Record<string, string> = {
    'query.cond': input.condition,
    'query.locn': input.location || '',
    'query.rslt': input.status || '',
    'query.phase': input.phase || '',
    'pageSize': String(input.maxResults || 10),
    'format': 'json'
  };

  // 移除空值参数
  Object.keys(params).forEach(key => {
    if (!params[key]) {
      delete params[key];
    }
  });

  return params;
}

/**
 * 调用ClinicalTrials.gov API
 * @param input 查询参数
 * @returns API响应数据
 */
export async function fetchClinicalTrials(input: ClinicalTrialsInput) {
  try {
    const queryParams = buildQueryParams(input);
    const searchParams = new URLSearchParams(queryParams);
    const url = `${API_BASE_URL}/studies?${searchParams.toString()}`;

    console.log('🔍 API请求URL:', url);

    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FastGPT-ClinicalTrials-Plugin/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ API响应成功，数据量:', data.studies?.length || 0);
    
    return data;
  } catch (error) {
    console.error('❌ API调用失败:', error);
    throw error;
  }
}
```

### 步骤3：数据处理逻辑

```typescript
// src/utils.ts - 数据处理工具函数
import { ClinicalTrialStudy } from './types';

/**
 * 格式化试验状态显示
 * @param status 原始状态
 * @returns 中文状态描述
 */
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'Recruiting': '招募中',
    'Not yet recruiting': '未开始招募',
    'Completed': '已完成',
    'Active, not recruiting': '进行中（不招募）',
    'Terminated': '已终止',
    'Suspended': '已暂停',
    'Withdrawn': '已撤回'
  };
  
  return statusMap[status] || status;
}

/**
 * 格式化试验阶段
 * @param phases 阶段数组
 * @returns 格式化的阶段字符串
 */
export function formatPhases(phases?: string[]): string {
  if (!phases || phases.length === 0) return '未指定';
  
  const phaseMap: Record<string, string> = {
    'Early Phase 1': '早期I期',
    'Phase 1': 'I期',
    'Phase 1/Phase 2': 'I/II期',
    'Phase 2': 'II期',
    'Phase 2/Phase 3': 'II/III期',
    'Phase 3': 'III期',
    'Phase 4': 'IV期',
    'Not Applicable': '不适用'
  };
  
  return phases.map(phase => phaseMap[phase] || phase).join(', ');
}

/**
 * 生成搜索结果摘要
 * @param studies 试验列表
 * @param totalCount 总数量
 * @param condition 搜索条件
 * @returns 摘要文本
 */
export function generateSearchSummary(
  studies: ClinicalTrialStudy[],
  totalCount: number,
  condition: string
): string {
  if (studies.length === 0) {
    return `未找到关于"${condition}"的临床试验。建议尝试更通用的疾病名称或检查拼写。`;
  }

  const statusCounts = studies.reduce((acc, study) => {
    const status = formatStatus(study.overallStatus);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusSummary = Object.entries(statusCounts)
    .map(([status, count]) => `${status}${count}项`)
    .join('，');

  return `找到${totalCount}项关于"${condition}"的临床试验，当前显示前${studies.length}项。状态分布：${statusSummary}。`;
}

/**
 * 清理和验证输入数据
 * @param input 原始输入
 * @returns 清理后的输入
 */
export function sanitizeInput(input: any): ClinicalTrialsInput {
  return {
    condition: String(input.condition || '').trim(),
    location: input.location ? String(input.location).trim() : undefined,
    status: input.status ? String(input.status).trim() : undefined,
    phase: input.phase ? String(input.phase).trim() : undefined,
    maxResults: Math.min(Math.max(Number(input.maxResults) || 10, 1), 100)
  };
}
```

### 步骤4：主要业务逻辑实现

```typescript
// src/index.ts - 主要业务逻辑
import { fetchClinicalTrials } from './api';
import { sanitizeInput, generateSearchSummary, formatStatus, formatPhases } from './utils';
import { ClinicalTrialsInput, ClinicalTrialsOutput } from './types';

/**
 * 临床试验查询插件主函数
 * @param input 用户输入参数
 * @returns 查询结果
 */
export default async function handler(input: any): Promise<ClinicalTrialsOutput> {
  try {
    // 1. 输入验证和清理
    const cleanInput = sanitizeInput(input);
    
    if (!cleanInput.condition) {
      throw new Error('疾病或条件不能为空，请输入要查询的疾病名称');
    }

    console.log('🔍 开始查询临床试验:', cleanInput);

    // 2. 调用API获取数据
    const apiResponse = await fetchClinicalTrials(cleanInput);
    
    if (!apiResponse || !apiResponse.studies) {
      throw new Error('API返回数据格式异常');
    }

    // 3. 数据处理和格式化
    const studies = apiResponse.studies.map((study: any) => ({
      nctId: study.protocolSection?.identificationModule?.nctId || '',
      briefTitle: study.protocolSection?.identificationModule?.briefTitle || '',
      officialTitle: study.protocolSection?.identificationModule?.officialTitle,
      overallStatus: study.protocolSection?.statusModule?.overallStatus || '',
      phase: study.protocolSection?.designModule?.phases || [],
      studyType: study.protocolSection?.designModule?.studyType || '',
      briefSummary: study.protocolSection?.descriptionModule?.briefSummary,
      detailedDescription: study.protocolSection?.descriptionModule?.detailedDescription,
      conditions: study.protocolSection?.conditionsModule?.conditions || [],
      // 添加格式化的显示字段
      statusDisplay: formatStatus(study.protocolSection?.statusModule?.overallStatus || ''),
      phaseDisplay: formatPhases(study.protocolSection?.designModule?.phases)
    }));

    const totalCount = apiResponse.totalCount || studies.length;
    
    // 4. 生成搜索摘要
    const searchSummary = generateSearchSummary(studies, totalCount, cleanInput.condition);

    // 5. 返回结果
    const result: ClinicalTrialsOutput = {
      totalCount,
      studies,
      searchSummary,
      hasMore: totalCount > studies.length
    };

    console.log('✅ 查询完成，返回结果数量:', studies.length);
    return result;

  } catch (error) {
    console.error('❌ 临床试验查询失败:', error);
    
    // 错误处理：返回友好的错误信息
    if (error instanceof Error) {
      throw new Error(`临床试验查询失败: ${error.message}`);
    }
    
    throw new Error('临床试验查询过程中发生未知错误，请稍后重试');
  }
}

// 导出输入输出定义
export { pluginInput, pluginOutput };
```

## 🔌 API集成最佳实践

### 1. 错误处理策略

```typescript
// 分层错误处理
class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// 网络错误处理
function handleNetworkError(error: any): never {
  if (error.name === 'AbortError') {
    throw new APIError('请求超时，请稍后重试');
  }
  
  if (error.code === 'ENOTFOUND') {
    throw new APIError('网络连接失败，请检查网络设置');
  }
  
  throw new APIError(`网络请求失败: ${error.message}`, undefined, error);
}
```

### 2. 缓存策略

```typescript
// 简单内存缓存实现
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5分钟缓存

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

const cache = new SimpleCache();
```

### 3. 限流处理

```typescript
// 简单限流器
class RateLimiter {
  private requests: number[] = [];
  private maxRequests = 10; // 每分钟最多10次请求
  private windowMs = 60 * 1000; // 1分钟窗口

  async checkLimit(): Promise<void> {
    const now = Date.now();
    
    // 清理过期请求
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      throw new Error('请求过于频繁，请稍后重试');
    }
    
    this.requests.push(now);
  }
}
```

## 🧪 测试与验证

### 1. 单元测试

```javascript
// test_clinical_trials.js - 功能测试
const { test, expect } = require('@jest/globals');
const handler = require('../modules/tool/packages/clinicaltrials/src/index.js').default;

// 基础功能测试
test('基础查询功能', async () => {
  const input = {
    condition: 'diabetes',
    maxResults: 5
  };
  
  const result = await handler(input);
  
  expect(result).toHaveProperty('totalCount');
  expect(result).toHaveProperty('studies');
  expect(result).toHaveProperty('searchSummary');
  expect(Array.isArray(result.studies)).toBe(true);
  expect(result.studies.length).toBeLessThanOrEqual(5);
});

// 错误处理测试
test('空输入处理', async () => {
  const input = { condition: '' };
  
  await expect(handler(input)).rejects.toThrow('疾病或条件不能为空');
});

// 边界条件测试
test('最大结果数限制', async () => {
  const input = {
    condition: 'cancer',
    maxResults: 150 // 超过限制
  };
  
  const result = await handler(input);
  expect(result.studies.length).toBeLessThanOrEqual(100);
});
```

### 2. 集成测试

```javascript
// test_integration.js - 集成测试
const request = require('supertest');
const app = require('../src/index.js');

test('完整工作流测试', async () => {
  const response = await request(app)
    .post('/api/tools/clinicaltrials')
    .send({
      condition: 'COVID-19',
      location: 'China',
      status: 'Recruiting',
      maxResults: 10
    })
    .expect(200);
    
  expect(response.body).toHaveProperty('totalCount');
  expect(response.body.studies).toBeDefined();
});
```

## ⚡ 性能优化

### 1. 响应时间优化

```typescript
// 并行处理多个API调用
async function fetchMultipleEndpoints(input: ClinicalTrialsInput) {
  const [studiesData, statisticsData] = await Promise.all([
    fetchClinicalTrials(input),
    fetchTrialStatistics(input.condition) // 假设的统计API
  ]);
  
  return { studiesData, statisticsData };
}

// 数据预处理
function preprocessStudyData(rawStudy: any): ClinicalTrialStudy {
  // 提前计算和格式化数据，避免在渲染时处理
  return {
    ...rawStudy,
    statusDisplay: formatStatus(rawStudy.overallStatus),
    phaseDisplay: formatPhases(rawStudy.phases),
    shortSummary: truncateText(rawStudy.briefSummary, 200)
  };
}
```

### 2. 内存使用优化

```typescript
// 大数据集分页处理
function paginateResults<T>(data: T[], page: number, pageSize: number): T[] {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return data.slice(startIndex, endIndex);
}

// 及时清理大对象
function processLargeDataset(data: any[]) {
  const processed = data.map(item => {
    const result = processItem(item);
    // 清理原始数据引用
    item = null;
    return result;
  });
  
  return processed;
}
```

## 📚 文档编写

### 1. README.md 模板

```markdown
# 临床试验查询插件

## 功能概述

本插件用于查询 ClinicalTrials.gov 数据库中的临床试验信息，支持按疾病、地点、状态等条件进行筛选。

## 使用方法

### 输入参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| condition | string | 是 | 疾病或条件名称 | "糖尿病"、"癌症" |
| location | string | 否 | 地理位置 | "China"、"Beijing" |
| status | string | 否 | 试验状态 | "Recruiting" |
| maxResults | number | 否 | 最大结果数(1-100) | 10 |

### 输出结果

| 字段名 | 类型 | 说明 |
|--------|------|------|
| totalCount | number | 符合条件的试验总数 |
| studies | array | 试验详细信息列表 |
| searchSummary | string | 搜索结果摘要 |

### 使用示例

```json
{
  "condition": "糖尿病",
  "location": "China",
  "status": "Recruiting",
  "maxResults": 10
}
```

## 注意事项

1. 疾病名称建议使用英文或标准医学术语
2. 地点可以是国家、省份或城市名称
3. API有调用频率限制，请合理使用
4. 数据来源于ClinicalTrials.gov，更新可能有延迟

## 错误处理

- 网络超时：自动重试机制
- 参数错误：返回详细错误信息
- API限流：提示用户稍后重试

## 版本历史

- v1.0.0: 初始版本，支持基础查询功能
```

### 2. API文档

```markdown
# ClinicalTrials API 集成文档

## API端点

- 基础URL: `https://clinicaltrials.gov/api/v2`
- 查询端点: `/studies`
- 请求方法: GET
- 响应格式: JSON

## 请求参数

| 参数 | 说明 | 示例 |
|------|------|------|
| query.cond | 疾病条件 | diabetes |
| query.locn | 地理位置 | China |
| query.rslt | 试验状态 | Recruiting |
| pageSize | 页面大小 | 10 |
| format | 响应格式 | json |

## 响应结构

```json
{
  "totalCount": 1234,
  "studies": [
    {
      "protocolSection": {
        "identificationModule": {
          "nctId": "NCT12345678",
          "briefTitle": "Study Title"
        },
        "statusModule": {
          "overallStatus": "Recruiting"
        }
      }
    }
  ]
}
```
```

## ⚠️ 踩坑提醒

### 1. 开发环境问题

**问题：bun命令找不到**
```bash
# 错误信息
bash: bun: command not found

# 解决方案
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # 或重启终端
```

**问题：pre-commit钩子失败**
```bash
# 临时跳过钩子
git commit -m "message" --no-verify

# 或修复lint错误
bun run lint --fix
```

### 2. API集成问题

**问题：CORS跨域错误**
```typescript
// 错误：直接在前端调用API
fetch('https://clinicaltrials.gov/api/v2/studies')

// 正确：通过后端代理
// 在插件中调用，FastGPT会处理CORS
```

**问题：API响应超时**
```typescript
// 设置合理的超时时间
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

fetch(url, { signal: controller.signal })
```

**问题：API限流**
```typescript
// 实现重试机制
async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 3. 数据处理问题

**问题：API返回数据结构不一致**
```typescript
// 错误：直接访问嵌套属性
const title = study.protocolSection.identificationModule.briefTitle;

// 正确：使用可选链和默认值
const title = study.protocolSection?.identificationModule?.briefTitle || '未知标题';
```

**问题：中文编码问题**
```typescript
// 确保正确处理中文字符
const condition = encodeURIComponent(input.condition);
```

**问题：大数据量内存溢出**
```typescript
// 错误：一次性处理所有数据
const allStudies = await fetchAllStudies(); // 可能有数万条

// 正确：分页处理
const studies = await fetchStudies({ pageSize: 100 });
```

### 4. 类型定义问题

**问题：TypeScript类型错误**
```typescript
// 错误：使用any类型
function processData(data: any) {
  return data.someProperty; // 运行时可能出错
}

// 正确：定义完整类型
interface ApiResponse {
  studies: Study[];
  totalCount: number;
}

function processData(data: ApiResponse) {
  return data.studies; // 类型安全
}
```

### 5. 错误处理问题

**问题：错误信息不友好**
```typescript
// 错误：直接抛出原始错误
throw error;

// 正确：提供用户友好的错误信息
if (error.code === 'ENOTFOUND') {
  throw new Error('网络连接失败，请检查网络设置');
}
```

### 6. 性能问题

**问题：同步处理导致阻塞**
```typescript
// 错误：同步处理大量数据
studies.forEach(study => {
  processStudy(study); // 阻塞主线程
});

// 正确：异步批处理
for (let i = 0; i < studies.length; i += 100) {
  const batch = studies.slice(i, i + 100);
  await Promise.all(batch.map(processStudy));
}
```

### 7. Git操作问题

**问题：提交了不应该提交的文件**
```bash
# 从Git中移除但保留本地文件
git rm --cached unwanted-file

# 更新.gitignore
echo "unwanted-file" >> .gitignore
```

**问题：分支合并冲突**
```bash
# 安全的合并方式
git fetch upstream
git checkout main
git merge upstream/main --no-ff
```

### 8. 测试问题

**问题：测试环境不稳定**
```typescript
// 使用Mock避免依赖外部API
jest.mock('./api', () => ({
  fetchClinicalTrials: jest.fn().mockResolvedValue(mockData)
}));
```

**问题：异步测试超时**
```javascript
// 设置合理的测试超时
test('API调用测试', async () => {
  // 测试代码
}, 30000); // 30秒超时
```

## 🚀 发布流程

### 1. 发布前检查

```bash
# 代码质量检查
bun run lint
bun run prettier
bun run test

# 功能测试
bun run dev
# 在FastGPT中测试插件功能

# 文档检查
# 确保README.md完整
# 确保代码注释充分
```

### 2. 版本管理

```bash
# 创建发布分支
git checkout -b release/v1.0.0

# 更新版本号
# 修改package.json和config.ts中的版本号

# 提交发布
git add .
git commit -m "release: v1.0.0"
git push origin release/v1.0.0
```

### 3. PR创建

```bash
# 创建PR到主仓库
gh pr create --title "feat: 添加临床试验查询插件" \
             --body "详细的PR描述" \
             --base main \
             --head release/v1.0.0
```

## 📝 开发日志模板

```markdown
# 插件开发日志

## 2024-01-XX 项目启动
- [x] 需求分析和技术调研
- [x] API文档研究
- [x] 项目结构设计

## 2024-01-XX 核心开发
- [x] 类型定义完成
- [x] API调用封装
- [x] 数据处理逻辑
- [x] 错误处理机制

## 2024-01-XX 测试优化
- [x] 单元测试编写
- [x] 集成测试
- [x] 性能优化
- [x] 文档完善

## 遇到的问题
1. API响应格式复杂 - 通过类型定义解决
2. 网络超时问题 - 添加重试机制
3. 中文编码问题 - 使用encodeURIComponent

## 经验总结
1. 提前做好类型定义，避免后期重构
2. 错误处理要考虑用户体验
3. 性能优化从设计阶段就要考虑
4. 文档和测试同样重要
```

---

**这份指南基于实际开发经验总结，涵盖了从需求分析到发布的完整流程。遵循这个指南可以避免大部分常见问题，提高开发效率。** 🎉