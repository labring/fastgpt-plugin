# Worker 系统实现总结

## 📁 目录结构

```
modules/tool/
├── worker/                          # Worker 源码目录
│   ├── utils.ts                     # Worker 工具函数
│   ├── README.md                    # 使用文档
│   ├── cheerioToMarkdown/           # Cheerio HTML 转 Markdown
│   │   └── index.ts
│   └── htmlToMarkdown/              # 纯 HTML 转 Markdown
│       ├── index.ts
│       └── utils.ts
├── build/
│   ├── build-workers.ts             # Worker 构建脚本
│   └── index.ts                     # 主构建入口
└── packages/
    └── fetchUrl/src/
        └── index.ts                 # 使用 worker 的示例

dist/
└── workers/
    └── tool/                        # Worker 编译输出目录
        ├── cheerioToMarkdown.worker.js
        └── htmlToMarkdown.worker.js
```

## 🔧 核心文件

### 1. `modules/tool/worker/utils.ts`
Worker 运行时工具函数，提供：
- `runWorker<T>(workerName, data, timeout?)` - 调用 worker
- `workerResponse({ parentPort, status, data })` - worker 响应函数

### 2. `modules/tool/build/build-workers.ts`
Worker 构建系统，自动：
- 扫描 `modules/tool/worker/*/index.ts`
- 编译到 `dist/workers/tool/{workerName}.worker.js`

### 3. `modules/tool/worker/{workerName}/index.ts`
Worker 实现文件，每个 worker 是一个独立目录

## 🚀 使用方式

### 创建新 Worker

1. 在 `modules/tool/worker/` 下创建文件夹：
```bash
mkdir modules/tool/worker/myWorker
```

2. 创建 `modules/tool/worker/myWorker/index.ts`：
```typescript
import { parentPort } from 'worker_threads';
import { workerResponse } from '@tool/worker/utils';

parentPort?.on('message', (params) => {
  try {
    const result = processData(params);
    workerResponse({ parentPort, status: 'success', data: result });
  } catch (error) {
    workerResponse({ parentPort, status: 'error', data: error });
  }
});
```

3. 在工具中调用：
```typescript
import { runWorker } from '@tool/worker/utils';

const result = await runWorker('myWorker', data);
```

4. 构建：
```bash
bun run build:pkg
```

## ✅ 已实现功能

- ✅ 自动扫描 worker 目录
- ✅ 自动编译所有 worker
- ✅ 统一的工具函数接口
- ✅ 完整的 TypeScript 支持
- ✅ 超时控制和错误处理
- ✅ 详细的使用文档

## 🎯 设计特点

1. **集中管理**：所有 worker 统一放在 `modules/tool/worker/` 目录
2. **约定优于配置**：遵循目录结构即可，无需额外配置
3. **类型安全**：完整的 TypeScript 类型推断
4. **独立编译**：每个 worker 编译为独立的 `.worker.js` 文件
5. **易于扩展**：添加新 worker 只需创建新文件夹

## 📝 现有 Worker

| Worker 名称 | 功能 | 输入 | 输出 |
|------------|------|------|------|
| `cheerioToMarkdown` | Cheerio HTML 转 Markdown | `{ fetchUrl, $, selector? }` | `{ markdown, title, usedSelector }` |
| `htmlToMarkdown` | 纯 HTML 转 Markdown | `{ html }` | `string` (markdown) |

## 🔄 构建流程

```
bun run build:pkg
        ↓
扫描 modules/tool/worker/*/index.ts
        ↓
Bun.build 编译每个 worker
        ↓
输出到 dist/workers/tool/{name}.worker.js
```

## 📦 集成示例

`packages/fetchUrl/src/index.ts`:
```typescript
import { runWorker } from '@tool/worker/utils';

const $ = cheerio.load(html);
const { title, markdown } = await runWorker('cheerioToMarkdown', {
  fetchUrl: url,
  $,
  selector: 'body'
});
```

## 🛠️ 开发命令

```bash
# 构建所有工具和 worker
bun run build:pkg

# 查看编译结果
ls -lh dist/workers/tool/

# 清理 worker 编译产物
rm -rf dist/workers/tool/
```

## 📚 文档

完整使用文档：`modules/tool/worker/README.md`

## ✨ 总结

一个简洁、高效、易用的 Worker 封装系统：
- **简单**：3 步即可创建新 worker
- **自动**：构建和加载完全自动化
- **安全**：类型安全 + 错误处理 + 超时控制
- **清晰**：统一的目录结构和命名规范
