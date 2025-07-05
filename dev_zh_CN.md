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
