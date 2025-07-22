# FastGPT 插件开发贡献指南

本文档详细介绍如何在本地开发 FastGPT 插件并提交 Pull Request (PR) 的完整流程。

## 📋 目录

- [环境准备](#环境准备)
- [项目设置](#项目设置)
- [本地开发](#本地开发)
- [代码规范](#代码规范)
- [测试验证](#测试验证)
- [提交流程](#提交流程)
- [PR 创建](#pr-创建)
- [常见问题](#常见问题)

## 🛠 环境准备

### 必需工具

1. **Node.js** (推荐 v18+)
2. **Bun** (包管理器)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```
3. **Git**
4. **GitHub 账号**

### 可选工具

- **GitHub CLI** (gh) - 用于命令行操作 PR
- **VS Code** - 推荐的开发环境

## 🚀 项目设置

### 1. Fork 仓库

1. 访问 [FastGPT Plugin 仓库](https://github.com/labring/fastgpt-plugin)
2. 点击右上角 "Fork" 按钮
3. 选择你的 GitHub 账号作为目标

### 2. 克隆项目

```bash
# 克隆你的 Fork 仓库
git clone https://github.com/YOUR_USERNAME/fastgpt-plugin.git
cd fastgpt-plugin

# 添加上游仓库
git remote add upstream https://github.com/labring/fastgpt-plugin.git

# 验证远程仓库配置
git remote -v
```

### 3. 安装依赖

```bash
# 安装项目依赖
bun install

# 安装 SDK 依赖
cd sdk
bun install
cd ..
```

## 💻 本地开发

### 1. 启动开发服务器

```bash
# 启动开发服务器
bun run dev

# 服务器将在 http://localhost:5100 启动
```

### 2. 创建新插件

```bash
# 使用脚手架创建新插件
bun run newTool

# 按提示输入插件信息
# - 插件名称 (英文，小写)
# - 插件描述
# - 作者信息
```

### 3. 插件开发结构

```
modules/tool/packages/your-plugin/
├── config.ts          # 插件配置
├── index.ts           # 插件入口
├── package.json       # 插件元信息
├── README.md          # 插件说明文档
└── src/
    └── index.ts       # 核心实现逻辑
```

### 4. 核心文件说明

#### config.ts
```typescript
import type { PluginConfig } from '../../type';

export const config: PluginConfig = {
  id: 'your-plugin-id',
  name: '插件名称',
  description: '插件描述',
  avatar: '/imgs/tools/your-plugin.svg',
  author: '作者名称',
  version: '1.0.0',
  documentUrl: 'https://doc.fastgpt.in/docs/development/custom-plugin/',
  isActive: true
};
```

#### src/index.ts
```typescript
import { PluginInputModule, PluginOutputModule } from '../../type';

const pluginInput: PluginInputModule[] = [
  {
    key: 'input1',
    type: 'string',
    label: '输入参数',
    description: '参数描述',
    required: true
  }
];

const pluginOutput: PluginOutputModule[] = [
  {
    key: 'output1',
    type: 'string',
    label: '输出结果',
    description: '结果描述'
  }
];

export default async function handler({
  input1
}: {
  input1: string;
}) {
  // 插件核心逻辑
  const result = await processInput(input1);
  
  return {
    output1: result
  };
}

export { pluginInput, pluginOutput };
```

## 📝 代码规范

### 1. 代码风格

- 使用 TypeScript
- 遵循 ESLint 规则
- 使用 Prettier 格式化
- 添加适当的中文注释

### 2. 提交信息规范

```bash
# 功能添加
git commit -m "feat: 添加XXX插件"

# 问题修复
git commit -m "fix: 修复XXX问题"

# 文档更新
git commit -m "docs: 更新XXX文档"

# 代码重构
git commit -m "refactor: 重构XXX模块"

# 性能优化
git commit -m "perf: 优化XXX性能"

# 测试相关
git commit -m "test: 添加XXX测试"

# 构建相关
git commit -m "build: 更新构建配置"

# 其他杂项
git commit -m "chore: 更新依赖包"
```

### 3. 文件命名

- 插件目录：小写字母 + 连字符 (kebab-case)
- TypeScript 文件：camelCase
- 配置文件：保持原有命名风格

## 🧪 测试验证

### 1. 本地测试

```bash
# 运行 lint 检查
bun run lint

# 运行格式化
bun run prettier

# 运行测试套件
bun run test
```

### 2. 功能测试

1. 启动开发服务器
2. 在 FastGPT 中配置插件
3. 创建工作流测试插件功能
4. 验证输入输出是否符合预期

### 3. 文档完善

- 更新插件 README.md
- 添加使用示例
- 记录配置参数
- 说明注意事项

## 📤 提交流程

### 1. 同步上游代码

```bash
# 获取上游最新代码
git fetch upstream

# 切换到主分支
git checkout main

# 合并上游更新
git merge upstream/main

# 推送到你的 Fork
git push origin main
```

### 2. 创建功能分支

```bash
# 创建并切换到新分支
git checkout -b feat/your-plugin-name

# 或者修复分支
git checkout -b fix/issue-description
```

### 3. 开发和提交

```bash
# 添加文件到暂存区
git add .

# 提交更改
git commit -m "feat: 添加XXX插件"

# 推送到远程分支
git push origin feat/your-plugin-name
```

### 4. 处理冲突

如果遇到合并冲突：

```bash
# 拉取最新代码
git pull upstream main

# 解决冲突后
git add .
git commit -m "resolve: 解决合并冲突"

# 推送更新
git push origin feat/your-plugin-name
```

## 🔄 PR 创建

### 1. 通过 GitHub 网页

1. 访问你的 Fork 仓库
2. 点击 "Compare & pull request"
3. 选择目标分支：`labring/fastgpt-plugin:main`
4. 填写 PR 标题和描述
5. 点击 "Create pull request"

### 2. 通过 GitHub CLI

```bash
# 安装 GitHub CLI
brew install gh  # macOS
# 或其他平台的安装方式

# 登录 GitHub
gh auth login

# 创建 PR
gh pr create --title "feat: 添加XXX插件" --body "详细描述"
```

### 3. PR 描述模板

```markdown
## 📝 变更说明

### 新增功能
- [ ] 添加XXX插件
- [ ] 支持XXX功能

### 问题修复
- [ ] 修复XXX问题

### 文档更新
- [ ] 更新README文档
- [ ] 添加使用示例

## 🧪 测试情况

- [ ] 本地功能测试通过
- [ ] 代码规范检查通过
- [ ] 文档完整性检查

## 📋 检查清单

- [ ] 代码遵循项目规范
- [ ] 添加了适当的注释
- [ ] 更新了相关文档
- [ ] 测试覆盖新功能
- [ ] 没有引入破坏性变更

## 🔗 相关链接

- 相关 Issue: #xxx
- 文档链接: [链接]
```

## ❓ 常见问题

### Q: pre-commit 钩子失败怎么办？

```bash
# 跳过 pre-commit 钩子
git commit -m "your message" --no-verify

# 或者修复 lint 错误后重新提交
bun run lint --fix
git add .
git commit -m "your message"
```

### Q: 如何更新已提交的 PR？

```bash
# 在同一分支上继续开发
git add .
git commit -m "update: 更新XXX"
git push origin your-branch-name

# PR 会自动更新
```

### Q: 如何处理 "bun: command not found" 错误？

```bash
# 重新安装 bun
curl -fsSL https://bun.sh/install | bash

# 重启终端或重新加载配置
source ~/.bashrc  # 或 ~/.zshrc
```

### Q: 如何删除不需要的文件？

```bash
# 从 Git 跟踪中移除但保留本地文件
git rm --cached filename

# 完全删除文件
git rm filename

# 更新 .gitignore 防止再次提交
echo "filename" >> .gitignore
```

### Q: 如何回滚错误的提交？

```bash
# 回滚最后一次提交（保留更改）
git reset --soft HEAD~1

# 回滚最后一次提交（丢弃更改）
git reset --hard HEAD~1

# 如果已经推送，需要强制推送
git push --force-with-lease origin your-branch
```

## 📚 参考资源

- [FastGPT 官方文档](https://doc.fastgpt.in/)
- [插件开发指南](https://doc.fastgpt.in/docs/development/custom-plugin/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Git 官方文档](https://git-scm.com/doc)
- [GitHub 官方文档](https://docs.github.com/)

## 🤝 获得帮助

- 提交 Issue: [GitHub Issues](https://github.com/labring/fastgpt-plugin/issues)
- 社区讨论: [GitHub Discussions](https://github.com/labring/fastgpt-plugin/discussions)
- 官方文档: [FastGPT 文档](https://doc.fastgpt.in/)

---

**感谢你为 FastGPT 插件生态系统做出的贡献！** 🎉