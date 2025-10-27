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

## 系统工具

### 新增系统工具类型

modules/tool/type/tool.ts 下修改 `ToolTypeMap` 字段来增加类型枚举。

### 工具集/工具声明规则

1. 名字和描述至少包含中英文
2. 工具还包含包含`toolDescription`字段，用于给`LLM`的工具调用提示，`description`是给使用者看到。
3. 工具输入字段里也可以声明`toolDescription`，表示该字段可以由模型生成。

### toolDescription 声明规则

1. 工具的`toolDescription`，包含2个主体：服务商和工具功能。
2. input 字段的`toolDescription`，只需包含字段功能描述即可。

### 内置的工具函数

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


## 模型

### 新增模型提供商

1. modules/model/provider 下新增对应提供商目录
2. modules/model/constants.ts 下增加模型名字和对应 aiproxy 的映射
3. modules/model/init.ts 下引入新的模型提供商

### 新增模型

1. modules/model/provider 找到对应模型提供商配置文件
2. 按 ConfigModelItemSchema 数据类型填写配置即可
