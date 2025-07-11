# FastGPT-plugin 开发文档


## 常用命令

### 安装依赖

```bash
bun install
```

### 构建

```bash
bun run build
```

### 运行

- 开发模式
```bash
bun run dev
```

在开发模式下，每次保存文件时，worker 将会被重新构建（热重载）。

- 生产模式（构建后）
```bash
bun run prod
```

## 开发

将 SDK 链接到 FastGPT：

在 FastGPT/packages/service 目录下：

```
pnpm link xxxx/fastgpt-plugin/sdk
```

此命令不会更新 package.json 文件。

### 开发习惯

#### 1. 使用英文注释
在代码中，使用英文注释来解释代码的用途。

#### 2. 使用英文变量名
在某些插件中，为了兼容性，变量名可能不是英文。

新插件应该使用英文变量名。

#### 3. 编写测试用例

为插件编写测试用例。

我们使用 [vitest](https://vitest.dev) 进行测试。

#### 4. 尽量不使用变量(let, var), 使用 const

“不可变”以提高代码的可读性，并且可以避免变量因错误赋值导致的问题，也对 TS 提示有所好处。

#### 5. 尽量不使用 any

#### 6. 变量作用域

尽量使用更小的变量作用域。通常可以用如下两种方式：

1. 使用“块作用域”语法

```typescript
const foo = () => {
  {
    const bar = 1;
    console.log(bar); // 1
  }
  console.log(bar); // ReferenceError: bar is not defined
};
```

2. 使用 IIFE (Immediately Invoked Function Expression, 立即执行函数表达式)
如果某个结果需要导出到更大的作用域中，可以使用 IIFE 语法。

```typescript
const foo = () => {
  const bar = (()=>{
    const a = 1;
    const b = 2;
    return a + b;
  })();
  console.log(bar); // 3
  console.log(a); // ReferenceError: a is not defined
};
```

### 系统工具内可用的工具函数

系统内置了一些工具函数可供调用，其目录位于 `modules/tool/utils` 下。
在代码中可以使用 `import { xxx } from '@/tool/utils'` 的方式引入。

下面是工具函数的列表：

- delay: 延时
- getErrText: 错误处理
- htmlTable2Md: html表格转markdown
- retryFn: 重试函数
- replaceSensitiveText: 替换敏感文本
- request: 请求函数
- GET: GET请求
- POST: POST请求
- PUT: PUT请求
- DELETE: DELETE请求
- PATCH: PATCH请求
- createHttpClient: 创建自定义的http客户端
- getNanoid: 生成唯一id
- uploadFile: 上传文件到 Minio 中
