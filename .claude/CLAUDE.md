# FastGPT 插件开发指南

## 项目概述

FastGPT 插件系统是一个基于 monorepo 架构的插件开发平台，支持开发和部署各种 FastGPT 工具和工作流组件。

## 环境配置

### 开发环境 (Bun)
- **运行时**: Bun 1.2+
- **包管理**: Bun
- **构建**: 原生 TypeScript 支持
- **热重载**: 开发模式支持

### 生产环境 (Node.js v22)
- **运行时**: Node.js v22+
- **包管理**: npm/yarn
- **构建**: 构建到 `dist` 目录
- **部署**: 生产模式运行

## 项目结构

### Monorepo 工作空间
```json
"workspaces": [
  "sdk",
  "lib", 
  "modules/*",
  "runtime"
]
```

### 目录结构
- `packages/` - 核心包目录
  - `global/` - 全局配置和类型定义
    - `public/workflow-tool/modules/` - 工具集配置文件目录
  - `server/` - 服务器端代码
    - `src/` - 源代码
      - `api/` - API 路由和服务
        - `services/` - 服务层
          - `external/` - 外部工具适配服务
- `modules/` - 模块目录
  - `api/` - API 相关模块
    - `services/` - API 服务
      - `external/` - 外部工具服务实现
  - `tool/` - 工具模块
  - `model/` - 数据模型模块
  - `workflow/` - 工作流模块
- `runtime/` - 运行时模块
- `sdk/` - SDK 模块
- `lib/` - 共享库模块
- `dist/` - 构建输出目录
- `scripts/` - 构建和部署脚本

## 开发环境兼容性

### 关键差异

#### 1. 运行时环境
- **开发**: Bun 运行时，支持原生 TypeScript 执行
- **生产**: Node.js v22 运行时，构建后的 JavaScript 代码

#### 2. 构建输出
- **开发**: 直接运行 TypeScript 代码
- **生产**: 构建到 `dist/` 目录，包含：
  - `index.js` - 主入口文件
  - `worker.js` - Web Worker 文件
  - `tools/` - 构建后的工具目录
  - `workflows/` - 构建后的工作流目录

### 代码兼容性要求

**⚠️ 重要**: 所有在生产环境中运行的代码必须同时兼容 Bun 和 Node.js v22

#### 1. 文件系统操作
```typescript
// ✅ 正确：使用标准 Node.js API
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// ❌ 避免：使用 Bun 特有 API
// const file = Bun.file('path');
// const content = await file.text();
```

#### 2. 网络请求
```typescript
// ✅ 正确：使用标准 fetch API (Node.js 18+ 内置)
const response = await fetch(url);
const data = await response.json();

// ✅ 正确：使用 axios 等跨平台库
import axios from 'axios';
const response = await axios.get(url);

// ❌ 避免：使用 Bun 特有的网络 API
// const response = await Bun.fetch(url);
```

#### 3. 模块导入
```typescript
// ✅ 正确：标准 ES 模块语法
import { config } from './config.js';
import { tool } from '@tool/some-tool';

// ✅ 正确：使用路径别名
import { helper } from '@/lib/helper';
import { tool } from '@tool/some-tool';

// ❌ 避免：使用 Bun 特有的导入方式
// const module = await Bun.import('./module.ts');
```

#### 4. 环境变量
```typescript
// ✅ 正确：标准方式
const apiKey = process.env.API_KEY;

// ✅ 正确：类型安全的访问
const config = {
  apiKey: process.env.API_KEY || 'default',
  port: parseInt(process.env.PORT || '3000')
};
```

## 代码克隆策略

### Sparse Checkout 配置
对于只需要开发插件的场景，可以使用 sparse checkout 避免拉取所有代码：

```bash
# 初始化仓库
git clone --no-checkout <repository-url>
cd <repository-name>
git sparse-checkout init --no-cone

# 配置 sparse checkout
git sparse-checkout set --no-cone \
  /modules/tool/packages/sparseTool \
  /modules/tool/packages/testTool \
  /lib \
  /scripts \
  /packages/global/public/workflow-tool/modules
```

### 当前 sparse-checkout 配置
```
--no-cone
/*
!/modules/tool/packages/*
/modules/tool/packages/testPR
/modules/tool/packages/testPR/*
/Volumes/Code/fastgpt-plugins/modules/tool/packages/sparseTool
/modules/tool/packages/testTool
```

## 开发工作流

### 1. 环境设置
```bash
# 安装依赖
bun install

# 开发模式
bun run dev

# 构建项目
bun run build:runtime
```

### 2. 工具开发
```bash
# 创建新工具
bun run new:tool

# 安装插件
bun run install:plugins

# 构建工具包
bun run build:pkg
```

### 3. 测试和部署
```bash
# 运行测试
bun run test

# 构建生产版本
bun run build:runtime

# 启动生产服务
bun run start
```

**⚠️ 重要**: 
- 测试命令使用 `bun run test` 而不是 `bun test`
- 测试环境使用 Vitest 运行器，支持 mock 和覆盖率

## 快速适配指南

### 1. 工具适配步骤
1. **分析工具结构**：查看工具的入口文件、依赖关系、API 接口
2. **适配工具类型**：判断是 Simple Tool 还是 Complex Tool
3. **创建 FastGPT 配置**：根据工具类型创建对应的 manifest.json 和工具集配置
4. **实现 API 适配层**：在 `modules/api/services/external/` 目录下创建适配服务
5. **添加类型定义**：在对应的 types 目录下添加必要的类型定义
6. **创建工具集配置**：在 `packages/global/public/workflow-tool/modules/` 目录下创建工具集配置文件
7. **测试验证**：创建测试用例验证工具功能

### 2. 环境兼容性检查
- 确保代码在 Bun 和 Node.js v22 中都能运行
- 验证构建后的代码在 `dist` 目录中正确生成
- 测试生产环境的启动和运行

## 工具开发规范

### 1. 错误处理规范
**⚠️ 重要**: 工具函数内部不需要进行顶层的 try-catch，直接把错误抛出到外面处理

```typescript
// ✅ 正确：直接抛出错误
export async function tool(input: ToolInput): Promise<ToolOutput> {
  // 1. 获取 access_token
  const result = await handleGetAuthToken({
    grant_type: 'client_credential',
    appid: input.appId!,
    secret: input.appSecret!
  });
  
  if ('errcode' in result && result.errcode !== 0) {
    return {
      error_message: `获取 access_token 失败: ${result.errmsg}`
    };
  }
  
  // 直接执行操作，让错误自然抛出
  const processedData = await processData(result.access_token);
  return processedData;
}

// ❌ 错误：顶层 try-catch
export async function tool(input: ToolInput): Promise<ToolOutput> {
  try {
    // 业务逻辑
    const result = await someOperation();
    return result;
  } catch (error) {
    // 不要在这里处理所有错误
    return {
      error_message: error.message
    };
  }
}
```

### 2. 测试规范
**⚠️ 重要**: 测试应该使用 `bun run test` 而不是 `bun test`

```bash
# ✅ 正确的测试命令
bun run test

# ❌ 错误的测试命令
bun test
```

### 3. 工具结构规范
- 每个工具都应该有自己的目录：`children/toolName/`
- 必须包含：`config.ts`, `src/index.ts`, `index.ts`
- 可选包含：`test/index.test.ts`, `DESIGN.md`

## 最佳实践

### 1. 代码兼容性
- 使用标准的 Node.js API
- 避免使用 Bun 特有功能
- 定期在 Node.js 环境下测试构建结果

### 2. 性能优化
- 利用 Bun 的快速构建和热重载
- 生产环境使用优化的构建配置
- 合理使用 monorepo 的依赖共享

### 3. 质量保证
- 运行 linting 和格式化
- 执行完整的测试套件
- 验证跨环境兼容性

### 4. 错误处理
- 工具函数内部避免顶层 try-catch
- 让错误自然抛出，由外部处理
- 对于已知的业务错误，返回结构化的错误信息

## 常见问题

### Q: 如何确保代码在两个环境都兼容？
A: 使用标准的 Node.js API，避免 Bun 特有功能，定期在 Node.js 环境下测试。

### Q: 如何高效地克隆只需要的代码？
A: 使用 git sparse checkout，配置只需要的目录和文件。

### Q: 生产环境构建失败怎么办？
A: 检查 `dist` 目录结构，确保所有依赖都正确安装，验证 Node.js 版本兼容性。

### Q: 如何调试生产环境问题？
A: 在 `dist` 目录中设置断点，使用 Node.js 调试工具，检查构建日志。
