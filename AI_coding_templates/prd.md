---
name: "FastGPT 插件开发 PRD 模板"
description: 专门为 FastGPT 插件开发设计的产品需求文档模板，基于临床试验插件的成功实践。
---

## 目的

为 AI 开发者提供标准化的 FastGPT 插件开发 PRD 模板，涵盖插件设计、开发、测试和部署的完整流程，确保插件质量和用户体验。

## 核心原则

1. **用户体验优先**: 插件功能必须直观易用，符合 FastGPT 用户的使用习惯
2. **类型安全**: 严格的 TypeScript 类型定义，确保代码质量和可维护性
3. **错误处理**: 完善的异常处理机制，提供用户友好的错误提示
4. **性能优化**: 合理的缓存策略和批处理机制，确保响应速度
5. **安全可靠**: 输入验证、权限控制和敏感信息保护

---

## 插件目标

开发一个高质量的 FastGPT 插件，实现：

- [具体功能描述] - 详细描述插件要实现的核心功能
- 标准化的输入输出接口，符合 FastGPT 插件规范
- 完整的错误处理和用户反馈机制
- [扩展功能] - 除核心功能外的附加特性

## 业务价值

- **用户效率**: 为 FastGPT 用户提供 [具体业务场景] 的自动化解决方案
- **功能扩展**: 丰富 FastGPT 生态系统的工具集合
- **开发体验**: 提供标准化的开发模式和最佳实践
- **系统集成**: [与现有系统的集成方式]
- **用户价值**: [为最终用户带来的具体收益]

## 功能需求

### FastGPT 插件核心功能

**插件工具定义:**

- 插件工具按功能模块组织，每个工具有明确的输入输出定义
- 工具配置文件 `plugin.json` 定义插件元信息和工具列表
- [具体工具列表] - 例如："searchClinicalTrials", "getTrialDetails", "analyzeTrialData"
- 输入参数验证和类型检查确保数据安全
- 完善的错误处理和用户友好的提示信息
- [领域特定工具] - 针对特定业务场景的专用工具

**API 集成与数据处理:**

- 第三方 API 集成（如 ClinicalTrials.gov API）
- 数据缓存策略，提升响应速度
- 批量处理机制，支持大量数据查询
- 数据格式标准化和结构化输出

**输入输出接口:**

- 标准化的 JSON Schema 定义输入参数
- 结构化的响应格式，便于 FastGPT 解析
- 支持多种输出格式（文本、表格、图表等）
- 错误状态码和详细错误信息

**性能与可靠性:**

- 请求超时控制和重试机制
- 并发请求限制，避免 API 限流
- 内存使用优化，支持大数据量处理
- 日志记录和性能监控

### 成功标准

- [ ] 插件通过 FastGPT 插件验证器检查
- [ ] 所有工具的输入输出符合 JSON Schema 规范
- [ ] TypeScript 编译无错误，类型定义完整
- [ ] 本地开发服务器正常启动和响应
- [ ] 插件部署到生产环境成功
- [ ] API 调用正常，错误处理完善
- [ ] 用户界面友好，错误提示清晰易懂
- [ ] 性能测试通过，响应时间在可接受范围内
- [ ] [领域特定成功标准] - 如临床试验数据准确性验证

## 开发上下文

### 文档和参考资料 (必读)

```yaml
# 核心开发指南 - 优先阅读
- docfile: PLUGIN_DEVELOPMENT_GUIDE.md
  why: FastGPT 插件开发完整指南，包含架构设计和最佳实践

- docfile: AI_coding_guide.md
  why: FastGPT 插件开发框架，技术栈和代码规范

- docfile: developer_prompt.md
  why: FastGPT 插件开发专家提示词，开发工作流和质量标准

# 示例插件实现 - 学习参考模式
- file: src/clinicaltrials/
  why: 临床试验插件完整实现，展示插件开发最佳实践

- file: src/clinicaltrials/plugin.json
  why: 插件配置文件示例，定义工具和元信息

- file: src/clinicaltrials/api.ts
  why: API 集成模式，错误处理和数据转换

- file: src/clinicaltrials/types.ts
  why: TypeScript 类型定义，确保类型安全

- file: src/clinicaltrials/utils.ts
  why: 工具函数和数据处理逻辑

# 项目配置和工具
- file: package.json
  why: 依赖管理和脚本配置

- file: tsconfig.json
  why: TypeScript 编译配置

- file: .env.example
  why: 环境变量配置示例

# FastGPT 官方文档
- url: https://doc.fastgpt.in/docs/development/custom-plugin/
  why: FastGPT 插件开发官方文档

- url: https://doc.fastgpt.in/docs/development/custom-plugin/create-plugin
  why: 插件创建和配置指南

# 第三方 API 文档 (以临床试验为例)
- url: https://clinicaltrials.gov/api/
  why: ClinicalTrials.gov API 文档，了解数据结构和查询方式
```

### 当前代码库结构 (在项目根目录运行 `tree -I node_modules`)

```bash
# FastGPT 插件项目典型结构
/
├── src/
│   ├── clinicaltrials/          # 临床试验插件目录 ← 参考实现
│   │   ├── plugin.json          # 插件配置文件 ← 核心配置
│   │   ├── api.ts              # API 集成逻辑 ← API 调用模式
│   │   ├── types.ts            # TypeScript 类型定义 ← 类型安全
│   │   ├── utils.ts            # 工具函数 ← 数据处理
│   │   ├── constants.ts        # 常量定义
│   │   └── __tests__/          # 单元测试
│   │       ├── api.test.ts
│   │       └── utils.test.ts
│   ├── shared/                 # 共享工具和类型
│   │   ├── types.ts           # 通用类型定义
│   │   ├── utils.ts           # 通用工具函数
│   │   ├── errors.ts          # 错误处理
│   │   └── validation.ts      # 输入验证
│   └── index.ts               # 入口文件
├── docs/                      # 文档目录
│   ├── PLUGIN_DEVELOPMENT_GUIDE.md  # 开发指南
│   ├── AI_coding_guide.md           # 编码规范
│   └── developer_prompt.md          # 开发提示词
├── AI_coding_templates/       # 开发模板
│   └── prd.md                # PRD 模板 ← 当前文件
├── .env.example              # 环境变量示例
├── package.json              # 依赖管理
├── tsconfig.json             # TypeScript 配置
├── jest.config.js            # 测试配置
└── README.md                 # 项目说明
```

### 目标代码库结构 (需要添加/修改的文件)

```bash
# 根据具体插件需求调整
src/
├── [your-plugin-name]/       # 你的插件目录
│   ├── plugin.json          # 插件配置 - 必需
│   ├── api.ts              # API 集成 - 核心逻辑
│   ├── types.ts            # 类型定义 - 类型安全
│   ├── utils.ts            # 工具函数 - 数据处理
│   ├── constants.ts        # 常量配置
│   └── __tests__/          # 测试文件
└── shared/                  # 如需要，扩展共享模块
```

### 关键开发模式和注意事项

```typescript
// 关键：FastGPT 插件开发必须遵循的模式
// 1. 始终使用 Zod 进行输入验证
import { z } from 'zod';

const SearchTrialsSchema = z.object({
  condition: z.string().min(1, '疾病条件不能为空').max(100),
  location: z.string().optional(),
  status: z.enum(['recruiting', 'completed', 'active']).optional(),
  maxResults: z.number().int().min(1).max(100).default(10)
});

// 2. 标准化错误处理模式
export class PluginError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'PluginError';
  }
}

// 3. API 调用的统一错误处理
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`API调用失败: ${errorMessage}`, error);
    throw new PluginError(
      `${errorMessage}: ${error.message}`,
      'API_ERROR',
      500
    );
  }
}

// 4. 插件配置文件必须包含的字段
interface PluginConfig {
  id: string;           // 插件唯一标识
  name: string;         // 插件名称
  description: string;  // 插件描述
  version: string;      // 版本号
  author: string;       // 作者
  tools: ToolConfig[];  // 工具列表
}

// 5. 工具配置的标准结构
interface ToolConfig {
  name: string;         // 工具名称
  description: string;  // 工具描述
  input: object;        // JSON Schema 输入定义
  output: object;       // JSON Schema 输出定义
}

// 6. 环境变量类型定义
interface PluginEnv {
  // API 相关
  CLINICALTRIALS_API_KEY?: string;
  API_BASE_URL: string;
  
  // 缓存配置
  CACHE_TTL: string;
  
  // 性能配置
  REQUEST_TIMEOUT: string;
  MAX_CONCURRENT_REQUESTS: string;
}
```

## 实现蓝图

### 数据模型和类型定义

为类型安全和验证定义 TypeScript 接口和 Zod 模式。

```typescript
// 临床试验数据模型 (以临床试验插件为例)
interface ClinicalTrial {
  nctId: string;              // 试验编号
  title: string;              // 试验标题
  condition: string[];        // 疾病条件
  status: TrialStatus;        // 试验状态
  phase: string;              // 试验阶段
  location: Location[];       // 试验地点
  sponsor: string;            // 主办方
  startDate: string;          // 开始日期
  completionDate?: string;    // 完成日期
  description: string;        // 试验描述
  eligibility: Eligibility;   // 入选标准
}

// 试验状态枚举
enum TrialStatus {
  RECRUITING = 'recruiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated'
}

// 地点信息
interface Location {
  facility: string;           // 医疗机构
  city: string;              // 城市
  state?: string;            // 州/省
  country: string;           // 国家
  zipCode?: string;          // 邮编
}

// 入选标准
interface Eligibility {
  minAge: number;            // 最小年龄
  maxAge: number;            // 最大年龄
  gender: 'male' | 'female' | 'all';  // 性别要求
  criteria: string;          // 详细标准
}

// 插件工具输入验证模式
const SearchTrialsInputSchema = z.object({
  condition: z.string().min(1, '疾病条件不能为空').max(100),
  location: z.string().optional(),
  status: z.nativeEnum(TrialStatus).optional(),
  phase: z.string().optional(),
  maxResults: z.number().int().min(1).max(100).default(10),
  minAge: z.number().int().min(0).max(120).optional(),
  maxAge: z.number().int().min(0).max(120).optional(),
  gender: z.enum(['male', 'female', 'all']).optional()
});

// API 响应类型
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
  };
}
```

### 任务列表 (按顺序完成)

```yaml
任务 1 - 项目初始化:
  创建插件目录结构:
    - 创建 src/[plugin-name]/ 目录
    - 复制 src/clinicaltrials/ 作为模板参考
    - 根据具体需求调整目录结构

  配置环境变量:
    - 复制 .env.example 为 .env
    - 配置 API_BASE_URL (第三方API地址)
    - 配置 API_KEY (如果需要)
    - 配置缓存和性能相关参数

任务 2 - 插件配置文件:
  创建 plugin.json:
    - 定义插件基本信息 (id, name, description, version)
    - 配置工具列表和元信息
    - 定义输入输出 JSON Schema
    - 设置插件图标和分类

  验证配置文件:
    - 使用 JSON Schema 验证器检查格式
    - 确保所有必需字段都已填写
    - 验证工具名称的唯一性

任务 3 - 类型定义:
  创建 types.ts:
    - 定义核心数据模型接口
    - 创建 API 响应类型
    - 定义错误类型和状态码
    - 导出所有类型供其他模块使用

  创建 Zod 验证模式:
    - 为每个工具创建输入验证模式
    - 定义错误消息和验证规则
    - 确保类型安全和运行时验证

任务 4 - API 集成:
  创建 api.ts:
    - 实现第三方 API 调用逻辑
    - 添加错误处理和重试机制
    - 实现数据转换和格式化
    - 添加缓存策略 (如果需要)

  实现核心工具函数:
    - 为每个插件工具创建对应函数
    - 使用 safeApiCall 包装 API 调用
    - 实现数据验证和清洗
    - 返回标准化的响应格式

任务 5 - 工具函数:
  创建 utils.ts:
    - 实现数据处理和转换函数
    - 添加日期、字符串处理工具
    - 创建缓存管理函数
    - 实现通用验证和格式化函数

  创建 constants.ts:
    - 定义 API 端点和配置常量
    - 设置默认值和限制参数
    - 定义错误代码和消息

任务 6 - 错误处理:
  完善错误处理机制:
    - 实现自定义错误类
    - 添加错误日志记录
    - 创建用户友好的错误消息
    - 实现错误恢复策略

任务 7 - 单元测试:
  创建测试文件:
    - 为 API 函数编写单元测试
    - 测试错误处理和边界情况
    - 模拟第三方 API 响应
    - 验证数据转换的正确性

  运行测试:
    - 执行 npm test 确保所有测试通过
    - 检查测试覆盖率
    - 修复失败的测试用例

任务 8 - 本地测试:
  启动开发服务器:
    - 运行 npm run dev
    - 验证插件加载正常
    - 测试所有工具功能
    - 检查错误处理和用户体验

  集成测试:
    - 在 FastGPT 环境中测试插件
    - 验证输入输出格式正确
    - 测试性能和响应时间
    - 确认错误提示清晰易懂

任务 9 - 文档编写:
  创建插件文档:
    - 编写 README.md 说明文件
    - 创建 API 使用示例
    - 编写故障排除指南
    - 添加配置说明和最佳实践

任务 10 - 部署发布:
  准备发布:
    - 更新版本号和变更日志
    - 运行最终测试和代码检查
    - 生成生产构建
    - 创建发布包和文档
```

### Per Task Implementation Details

```typescript
// Task 3 - MCP Server Implementation Pattern
export class YourMCP extends McpAgent<Env, Record<string, never>, Props> {
  server = new McpServer({
    name: "Your MCP Server Name",
    version: "1.0.0",
  });

  // CRITICAL: Always implement cleanup
  async cleanup(): Promise<void> {
    try {
      await closeDb();
      console.log("Database connections closed successfully");
    } catch (error) {
      console.error("Error during database cleanup:", error);
    }
  }

  async alarm(): Promise<void> {
    await this.cleanup();
  }

  async init() {
    // PATTERN: Use centralized tool registration
    registerAllTools(this.server, this.env, this.props);
  }
}

// Task 3 - Tool Module Pattern (e.g., src/tools/your-feature-tools.ts)
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Props } from "../types";
import { z } from "zod";

const PRIVILEGED_USERS = new Set(["admin1", "admin2"]);

export function registerYourFeatureTools(server: McpServer, env: Env, props: Props) {
  // Tool 1: Available to all authenticated users
  server.tool(
    "yourBasicTool",
    "Description of your basic tool",
    YourToolSchema, // Zod validation schema
    async ({ param1, param2, options }) => {
      try {
        // PATTERN: Tool implementation with error handling
        const result = await performOperation(param1, param2, options);

        return {
          content: [
            {
              type: "text",
              text: `**Success**\n\nOperation completed\n\n**Result:**\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
            },
          ],
        };
      } catch (error) {
        return createErrorResponse(`Operation failed: ${error.message}`);
      }
    },
  );

  // Tool 2: Only for privileged users
  if (PRIVILEGED_USERS.has(props.login)) {
    server.tool(
      "privilegedTool",
      "Administrative tool for privileged users",
      { action: z.string() },
      async ({ action }) => {
        // Implementation
        return {
          content: [
            {
              type: "text",
              text: `Admin action '${action}' executed by ${props.login}`,
            },
          ],
        };
      },
    );
  }
}

// Task 3 - Update Tool Registry (src/tools/register-tools.ts)
import { registerYourFeatureTools } from "./your-feature-tools";

export function registerAllTools(server: McpServer, env: Env, props: Props) {
  // Existing registrations
  registerDatabaseTools(server, env, props);
  
  // Add your new registration
  registerYourFeatureTools(server, env, props);
}

// PATTERN: Export OAuth provider with MCP endpoints
export default new OAuthProvider({
  apiHandlers: {
    "/sse": YourMCP.serveSSE("/sse") as any,
    "/mcp": YourMCP.serve("/mcp") as any,
  },
  authorizeEndpoint: "/authorize",
  clientRegistrationEndpoint: "/register",
  defaultHandler: GitHubHandler as any,
  tokenEndpoint: "/token",
});
```

### Integration Points

```yaml
CLOUDFLARE_WORKERS:
  - wrangler.jsonc: Update name, environment variables, KV bindings
  - Environment secrets: GitHub OAuth credentials, database URL, encryption key
  - Durable Objects: Configure MCP agent binding for state persistence

GITHUB_OAUTH:
  - GitHub App: Create with callback URL matching your Workers domain
  - Client credentials: Store as Cloudflare Workers secrets
  - Callback URL: Must match exactly: https://your-worker.workers.dev/callback

DATABASE:
  - PostgreSQL connection: Use existing connection pooling patterns
  - Environment variable: DATABASE_URL with full connection string
  - Security: Use validateSqlQuery and isWriteOperation for all SQL

ENVIRONMENT_VARIABLES:
  - Development: .dev.vars file for local testing
  - Production: Cloudflare Workers secrets for deployment
  - Required: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, DATABASE_URL, COOKIE_ENCRYPTION_KEY

KV_STORAGE:
  - OAuth state: Used by OAuth provider for state management
  - Namespace: Create with `wrangler kv namespace create "OAUTH_KV"`
  - Configuration: Add namespace ID to wrangler.jsonc bindings
```

## Validation Gate

### Level 1: TypeScript & Configuration

```bash
# CRITICAL: Run these FIRST - fix any errors before proceeding
npm run type-check                 # TypeScript compilation
wrangler types                     # Generate Cloudflare Workers types

# Expected: No TypeScript errors
# If errors: Fix type issues, missing interfaces, import problems
```

### Level 2: Local Development Testing

```bash
# Start local development server
wrangler dev

# Test OAuth flow (should redirect to GitHub)
curl -v http://localhost:8792/authorize

# Test MCP endpoint (should return server info)
curl -v http://localhost:8792/mcp

# Expected: Server starts, OAuth redirects to GitHub, MCP responds with server info
# If errors: Check console output, verify environment variables, fix configuration
```

### Level 3: Unit test each feature, function, and file, following existing testing patterns if they are there.

```bash
npm run test
```

Run unit tests with the above command (Vitest) to make sure all functionality is working.

### Level 4: Database Integration Testing (if applicable)

```bash
# Test database connection
curl -X POST http://localhost:8792/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/call", "params": {"name": "listTables", "arguments": {}}}'

# Test permission validation
# Test SQL injection protection and other kinds of security if applicable
# Test error handling for database failures

# Expected: Database operations work, permissions enforced, errors handled gracefully, etc.
# If errors: Check DATABASE_URL, connection settings, permission logic
```

## Final Validation Checklist

### Core Functionality

- [ ] TypeScript compilation: `npm run type-check` passes
- [ ] Unit tests pass: `npm run test` passes
- [ ] Local server starts: `wrangler dev` runs without errors
- [ ] MCP endpoint responds: `curl http://localhost:8792/mcp` returns server info
- [ ] OAuth flow works: Authentication redirects and completes successfully

---

## Anti-Patterns to Avoid

### MCP-Specific

- ❌ Don't skip input validation with Zod - always validate tool parameters
- ❌ Don't forget to implement cleanup() method for Durable Objects
- ❌ Don't hardcode user permissions - use configurable permission systems

### Development Process

- ❌ Don't skip the validation loops - each level catches different issues
- ❌ Don't guess about OAuth configuration - test the full flow
- ❌ Don't deploy without monitoring - implement logging and error tracking
- ❌ Don't ignore TypeScript errors - fix all type issues before deployment
