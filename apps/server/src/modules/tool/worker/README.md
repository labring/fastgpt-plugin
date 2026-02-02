# Worker 系统

一个为 FastGPT 插件提供的轻量级 Worker 线程封装系统，支持在独立线程中运行计算密集型任务。

## 目录结构

```
modules/tool/worker/
├── utils.ts                    # Worker 工具函数 (runWorker, workerResponse)
├── cheerioToMarkdown/          # Cheerio HTML 转 Markdown
│   └── index.ts
├── htmlToMarkdown/             # 纯 HTML 转 Markdown
│   └── index.ts
└── README.md                   # 本文档
```

## 快速开始

### 1. 创建新的 Worker

在 `modules/tool/worker/` 目录下创建新文件夹，例如 `myWorker/`：

```bash
mkdir modules/tool/worker/myWorker
```

创建 `modules/tool/worker/myWorker/index.ts`:

```typescript
import { parentPort } from 'worker_threads';
import { workerResponse } from '@tool/worker/utils';

// 定义输入参数类型
type WorkerInput = {
  data: string;
  options?: any;
};

// 定义输出结果类型
type WorkerOutput = {
  result: string;
};

// 处理数据的核心逻辑
function processData(input: WorkerInput): WorkerOutput {
  // 你的处理逻辑
  const result = `Processed: ${input.data}`;
  
  return {
    result
  };
}

// 监听来自主线程的消息
parentPort?.on('message', (params: WorkerInput) => {
  try {
    const result = processData(params);
    
    workerResponse({
      parentPort,
      status: 'success',
      data: result
    });
  } catch (error) {
    workerResponse({
      parentPort,
      status: 'error',
      data: error
    });
  }
});
```

### 2. 在工具中调用 Worker

在你的工具包中（例如 `packages/yourTool/src/index.ts`）：

```typescript
import { runWorker } from '@tool/worker/utils';

export async function tool(props: any) {
  // 调用 worker
  const result = await runWorker<{ result: string }>(
    'myWorker',  // worker 名称（与 worker/ 下的文件夹名一致）
    {
      data: props.input,
      options: props.options
    },
    30000  // 超时时间（毫秒），可选，默认 30000
  );
  
  return {
    output: result.result
  };
}
```

### 3. 构建

运行构建命令：

```bash
# 构建所有工具和 worker
bun run build:pkg
```

构建后，worker 文件会被编译到 `dist/workers/tool/myWorker.worker.js`

## API 文档

### `runWorker<T>(workerName: string, data: any, timeout?: number): Promise<T>`

在 worker 线程中运行任务。

**参数：**
- `workerName` (string): Worker 名称，对应 `worker/` 下的文件夹名
- `data` (any): 传递给 worker 的数据
- `timeout` (number, 可选): 超时时间（毫秒），默认 30000

**返回：**
- `Promise<T>`: Worker 返回的结果

**示例：**
```typescript
const result = await runWorker<{ title: string; markdown: string }>(
  'cheerioToMarkdown',
  { fetchUrl: 'https://example.com', $, selector: 'body' }
);
```

### `workerResponse(options)`

在 worker 中发送响应回主线程。

**参数：**
- `parentPort` (MessagePort | null): Worker 的 parentPort
- `status` ('success' | 'error'): 响应状态
- `data` (any): 响应数据

**示例：**
```typescript
workerResponse({
  parentPort,
  status: 'success',
  data: { result: 'done' }
});
```

## 现有 Worker

### cheerioToMarkdown

将使用 Cheerio 加载的 HTML 转换为 Markdown。

**输入：**
```typescript
{
  fetchUrl: string;           // 原始 URL
  $: cheerio.CheerioAPI;      // Cheerio 实例
  selector?: string;          // CSS 选择器，默认 'body'
}
```

**输出：**
```typescript
{
  markdown: string;           // 转换后的 Markdown
  title: string;              // 页面标题
  usedSelector: string;       // 使用的选择器
}
```

**使用示例：**
```typescript
import * as cheerio from 'cheerio';
import { runWorker } from '@tool/worker/utils';

const html = '<html><body><h1>Hello</h1></body></html>';
const $ = cheerio.load(html);

const result = await runWorker('cheerioToMarkdown', {
  fetchUrl: 'https://example.com',
  $,
  selector: 'body'
});

console.log(result.markdown);
```

### htmlToMarkdown

将纯 HTML 字符串转换为 Markdown。

**输入：**
```typescript
{
  html: string;               // HTML 字符串
}
```

**输出：**
```typescript
string                        // Markdown 字符串
```

**使用示例：**
```typescript
import { runWorker } from '@tool/worker/utils';

const html = '<h1>Hello World</h1><p>This is a test.</p>';
const markdown = await runWorker<string>('htmlToMarkdown', { html });

console.log(markdown);
// # Hello World
// This is a test.
```

## 构建系统

### 自动扫描和编译

构建系统会自动：
1. 扫描 `modules/tool/worker/*/index.ts` 所有 worker
2. 使用 Bun 编译每个 worker
3. 输出到 `dist/workers/tool/{workerName}.worker.js`

### 构建配置

- **Target**: Node.js
- **External**: `worker_threads` (不打包 Node.js 内置模块)
- **Minify**: false (便于调试)
- **Naming**: `{workerName}.worker.js`

## 注意事项

1. **Worker 文件位置**：Worker 必须位于 `modules/tool/worker/{workerName}/index.ts`

2. **命名一致**：`runWorker()` 的第一个参数必须与 `worker/` 下的文件夹名完全一致

3. **超时处理**：设置合理的超时时间，避免 worker 长时间挂起

4. **错误处理**：在 worker 中使用 try-catch 捕获所有可能的错误

5. **资源清理**：Worker 会在完成或出错后自动终止，无需手动清理

6. **构建顺序**：在部署前确保运行 `bun run build:pkg` 以编译所有 worker

## 性能优化建议

1. **避免传递大对象**：Worker 线程间通信会序列化数据，避免传递过大的对象

2. **合理使用 Worker**：只在计算密集型任务中使用 Worker，简单任务直接在主线程执行更高效

3. **复用计算结果**：如果相同输入会产生相同输出，考虑添加缓存层

4. **控制并发数**：如果需要并发运行多个 Worker，注意控制数量避免资源耗尽

## 故障排查

### Worker 文件未找到

**错误信息：**
```
Worker file not found: /path/to/dist/workers/tool/xxx.worker.js
Please ensure worker source exists at modules/tool/worker/xxx/index.ts
and run 'bun run build:pkg' to build workers.
```

**解决方案：**
1. 确认 `modules/tool/worker/xxx/index.ts` 存在
2. 运行 `bun run build:pkg` 重新构建
3. 检查 `dist/workers/tool/` 目录是否有对应的 `.worker.js` 文件

### Worker 超时

**错误信息：**
```
Worker timeout after 30000ms
```

**解决方案：**
1. 增加超时时间：`runWorker('worker', data, 60000)`
2. 优化 worker 内的处理逻辑
3. 检查是否有死循环或无限等待

### TypeScript 类型错误

**解决方案：**
- 为 `runWorker` 提供泛型类型：
  ```typescript
  const result = await runWorker<YourResultType>('worker', data);
  ```

## 开发工具

### 查看已编译的 Worker

```bash
ls -lh dist/workers/tool/
```

### 查看 Worker 构建日志

```bash
bun run build:pkg
```

输出示例：
```
--- Building workers ---
Building workers...
Found 2 worker(s): cheerioToMarkdown, htmlToMarkdown
✓ Built worker: cheerioToMarkdown
✓ Built worker: htmlToMarkdown
Successfully built 2 worker(s)
```

### 清理构建产物

```bash
rm -rf dist/workers/tool/
```

## 何时使用 Worker？

### ✅ 适合使用 Worker

- 计算密集型任务（图片处理、加密、压缩）
- 大规模数据处理（解析大文件）
- 复杂的文本处理（正则、格式转换）
- HTML/Markdown 转换
- 可能导致阻塞的同步操作

### ❌ 不适合使用 Worker

- 简单快速的操作
- 网络 I/O（已经是异步的）
- 数据库查询（使用异步 API）
- 需要频繁通信的任务

## 实际案例

查看 `modules/tool/packages/fetchUrl/src/index.ts` 了解如何在实际工具中使用 worker。

## 贡献

欢迎贡献新的 worker 或改进现有的 worker！

创建新 worker 的步骤：
1. 在 `modules/tool/worker/` 下创建新文件夹
2. 创建 `index.ts` 实现 worker 逻辑
3. 运行 `bun run build:pkg` 测试
4. 提交 PR

## License

同主项目
