# Bun 包管理器使用指南

## 🚀 为什么选择 Bun？

Bun 是一个现代的 JavaScript 运行时和包管理器，具有以下优势：

- **极快的安装速度** - 比 npm 快 10-100 倍
- **内置测试运行器** - 无需额外配置
- **TypeScript 原生支持** - 无需编译步骤
- **兼容 Node.js** - 可以运行现有的 Node.js 项目
- **内置打包器** - 支持 ESM 和 CommonJS

## 📦 安装 Bun

### macOS/Linux
```bash
curl -fsSL https://bun.sh/install | bash
```

### Windows
```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

### 验证安装
```bash
bun --version
```

## 🛠️ 基本使用

### 项目初始化
```bash
# 创建新项目
bun init

# 使用模板创建项目
bun create <template> <project-name>
```

### 包管理
```bash
# 安装所有依赖
bun install

# 安装特定包
bun add <package-name>

# 安装开发依赖
bun add -d <package-name>

# 移除包
bun remove <package-name>

# 更新包
bun update
bun update <package-name>
```

### 运行脚本
```bash
# 运行 package.json 中的脚本
bun run <script-name>

# 直接运行文件
bun run index.ts

# 运行测试
bun test

# 开发模式（监听文件变化）
bun --watch run index.ts
```

## 🔧 FastGPT 插件开发中的使用

### 1. 项目设置
```bash
# 克隆项目后安装依赖
cd fastgpt-plugin-project
bun install
```

### 2. 开发流程
```bash
# 启动开发模式
bun run dev

# 运行测试
bun test

# 代码检查
bun run lint

# 构建项目
bun run build
```

### 3. 常用命令
```bash
# 安装新的依赖包
bun add axios zod

# 安装开发依赖
bun add -d @types/node vitest

# 运行特定测试文件
bun test src/utils.test.ts

# 监听模式运行测试
bun test --watch
```

## 📝 配置文件

### bunfig.toml
项目根目录的 `bunfig.toml` 文件用于配置 Bun 的行为：

```toml
[install]
cache = true
exact = false
registry = "https://registry.npmjs.org/"

[test]
coverage = true

[run]
bun = true
```

### package.json 配置
在 `package.json` 中指定包管理器：

```json
{
  "packageManager": "bun@1.0.0",
  "scripts": {
    "install:bun": "bun install",
    "install:npm": "npm install"
  }
}
```

## 🚀 性能优化

### 1. 缓存优化
```bash
# 清理缓存
bun pm cache rm

# 查看缓存信息
bun pm cache
```

### 2. 并行安装
Bun 默认并行安装依赖，无需额外配置。

### 3. 锁文件
Bun 使用 `bun.lockb` 二进制锁文件，比 `package-lock.json` 更快。

## 🔄 从 npm/yarn 迁移

### 1. 删除旧的锁文件
```bash
rm package-lock.json
rm yarn.lock
```

### 2. 安装依赖
```bash
bun install
```

### 3. 更新脚本
将 `package.json` 中的 `npm run` 替换为 `bun run`。

## 🧪 测试

### 内置测试运行器
```bash
# 运行所有测试
bun test

# 运行特定测试
bun test src/utils.test.ts

# 监听模式
bun test --watch

# 生成覆盖率报告
bun test --coverage
```

### 测试配置
在 `package.json` 中配置测试：

```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage"
  }
}
```

## 🐛 常见问题

### 1. 兼容性问题
如果某些包不兼容 Bun，可以使用 Node.js 运行：
```bash
node --loader bun/register index.ts
```

### 2. 环境变量
Bun 自动加载 `.env` 文件，无需额外配置。

### 3. TypeScript 支持
Bun 原生支持 TypeScript，无需编译步骤：
```bash
bun run index.ts
```

## 📚 更多资源

- [Bun 官方文档](https://bun.sh/docs)
- [Bun GitHub 仓库](https://github.com/oven-sh/bun)
- [Bun 社区](https://discord.gg/bun)

## 💡 最佳实践

1. **使用 .bunfig.toml** - 为项目配置 Bun 特定设置
2. **保留 package.json** - 确保与其他工具的兼容性
3. **利用内置功能** - 使用 Bun 的内置测试和打包功能
4. **监控性能** - 利用 Bun 的性能优势加速开发
5. **渐进式迁移** - 可以在现有项目中逐步采用 Bun

---

**Happy coding with Bun! 🥟**