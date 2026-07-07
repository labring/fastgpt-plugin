# How To Develop FastGPT System Plugins

Language: [简体中文](./how-to-devlop-plugin.md) | [English](./how-to-devlop-plugin.en.md)

## Introduction

This document targets system plugin development after FastGPT v4.15.0. The new FastGPT Plugin service unifies system tools, model presets, and similar capabilities as installable, updatable, runtime-isolated plugin packages. A plugin is eventually delivered to the FastGPT Plugin service as a `.pkg` file.

The currently stable plugin type is system tool plugins:

- Single tool: one plugin exposes one tool and is declared with `defineTool()`.
- Tool suite: one plugin exposes multiple related child tools and is declared with `defineToolSet()`.

System tool plugins run in the runtime provided by the FastGPT Plugin service. The FastGPT main service invokes tools through the plugin service, and plugin code uses `@fastgpt-plugin/sdk-factory` to describe input, output, secret configuration, and execution logic.

## Differences From The Legacy Mechanism

1. The deployment relationship between FastGPT and FastGPT Plugin remains an external extension model, and the overall architecture is still microservice-based.
2. The plugin package protocol upgrades from the old built-in system tool directory to a unified `.pkg` format, making installation, version management, hot updates, and future plugin type expansion easier.
3. The plugin runtime is managed by the server. The current default runtime is `local-pool`, where each plugin version has its own process pool, queue, and runtime configuration.
4. Plugin metadata, input/output schemas, secret schemas, and icon assets are included in build artifacts for use by FastGPT pages, workflows, and Agents.

## Repository Responsibilities

The FastGPT Plugin ecosystem mainly involves these repositories:

1. `fastgpt-plugin`
   This repository. It is a monorepo containing the Plugin Server, SDK, CLI, debug monitor, and infrastructure code.

2. `fastgpt-official-plugins`
   The official system plugin repository. It contains plugins maintained or reviewed by FastGPT officials. Official plugins require stricter code, functionality, security, and listing tests.

3. `fastgpt-community-plugins`
   The community plugin repository for third-party plugins submitted by the community. When community plugins are listed in the Marketplace, their source and risk notices are preserved.

4. `fastgpt-business-plugins`
   A private plugin repository for closed-source plugins, customer-customized plugins, and commercial delivery.

This repository only provides development, build, check, packaging, and server runtime capabilities. Specific plugin source code is usually placed in the official, community, or business plugin repositories.

## Plugin Marketplace And Usage Boundaries

FastGPT Marketplace is the plugin distribution channel for centrally displaying and distributing official and community plugins. Current boundaries:

- Marketplace is a SaaS distribution service and does not provide a private deployment version.
- Community plugins must first be submitted to the Community Plugins repository, pass basic review, and then enter Marketplace.
- The FastGPT cloud service does not yet support direct custom plugin uploads by users.
- Third-party custom plugins are currently mainly used through self-deployment or administrator upload in the business edition.

## Information To Collect Before Development

Clarify these items before coding:

| Information | Description |
| --- | --- |
| Plugin type | `tool` or `tool-suite`. |
| Plugin ID | `pluginId`, globally stable and unique. Keep it unchanged after release. |
| Child tool ID | Required only for tool suites. `children[].id` stays unchanged after release. |
| Chinese and English names | `name.en` and `name.zh-CN`. |
| Chinese and English descriptions | `description.en` and `description.zh-CN`. |
| Inputs | Type, constraints, default value, UI title, and description for each field. |
| Outputs | Type, meaning, and downstream usage for each field. |
| Secrets | API Key, Base URL, username/password, and similar values, described through `secretSchema`. |
| External API | Request method, auth method, timeout, rate limit, error response, and test account. |
| File capability | Whether file upload is needed. Use `ctx.invoke.uploadFile()` when uploading. |
| Streaming output | Whether intermediate progress should be shown to the user. Use `ctx.streamResponse()` for streaming output. |
| Test cases | Include at least success, invalid parameters, auth failure, and upstream failure. |

When missing information can be handled with reasonable defaults, continue and record assumptions in the submission notes. Missing information that affects plugin ID, auth method, billing, or listing security should be confirmed first.

## Developing With An Agent

When using Claude Code, Codex, or another agent tool, copy this prompt:

```plaintext
请根据以下 FastGPT 官方插件开发 Skill 开发插件：

https://raw.githubusercontent.com/labring/fastgpt-official-plugins/refs/heads/main/.agents/skills/develop-fastgpt-plugin/SKILL.md

执行要求：

1. 先读取并理解该 Skill 的完整内容，后续开发流程以该 Skill 为准。
2. 在开始编码前，收集插件名称、插件类型、中文/英文名称与描述、输入输出、密钥、外部 API、预期行为、错误处理和测试样例。
3. 如需求缺失，最多提出 3 个关键问题；如果可以合理默认，说明假设后继续推进。
4. 使用 `@fastgpt-plugin/cli` 创建插件骨架，并优先遵循仓库内已有插件的结构、命名、测试和构建方式。
5. 实现完成后运行必要验证，包括测试、构建、插件检查和打包；无法验证的项目需要说明原因。
6. 最终输出变更文件、验证结果、剩余假设和需要人工确认的外部 API 行为。
```

When developing or maintaining SDK/CLI in this repository, also refer to local skills:

- [`sdk/factory/skills/fastgpt-plugin-development/SKILL.md`](../../sdk/factory/skills/fastgpt-plugin-development/SKILL.md)
- [`sdk/factory/skills/fastgpt-system-tool-development/SKILL.md`](../../sdk/factory/skills/fastgpt-system-tool-development/SKILL.md)
- [`sdk/factory/skills/fastgpt-sdk-factory/SKILL.md`](../../sdk/factory/skills/fastgpt-sdk-factory/SKILL.md)

## Manual Development Flow

### 1. Prepare Environment

Recommended environment:

- Node.js version that satisfies the target plugin repository.
- `pnpm`; this repository uses `pnpm@10.33.2`.
- Git.
- GitHub CLI `gh`, used for forking, creating repositories, and submitting PRs.

When developing community plugins, first fork and clone the community repository:

```bash
gh repo fork labring/fastgpt-community-plugins --clone
cd fastgpt-community-plugins
pnpm install
```

When debugging the CLI or SDK in this repository, install dependencies and build the CLI/SDK first:

```bash
pnpm install
pnpm build:sdk-factory
pnpm build:cli
```

### 2. Create Plugin Skeleton

Single-tool plugin:

```bash
pnpx @fastgpt-plugin/cli create my-tool --type tool --cwd packages/tools
```

Tool-suite plugin:

```bash
pnpx @fastgpt-plugin/cli create my-tool-suite --type tool-suite --cwd packages/tools
```

You can also enter the target directory and create interactively:

```bash
pnpx @fastgpt-plugin/cli create
```

The CLI creates the plugin directory and common files:

| File | Purpose |
| --- | --- |
| `index.ts` | Plugin entry, default-exporting `defineTool()` or `defineToolSet()`. |
| `package.json` | Plugin dependencies and `build`, `build:dev`, `pack`, and `test` scripts. |
| `tsconfig.json` | TypeScript config. |
| `vitest.config.ts` | Test config. |
| `README.md` | Plugin description. |
| `logo.svg` | Main plugin icon. |

### 3. Implement The Plugin

The system tool entry must default-export an SDK factory instance:

```ts
import {
  createToolHandler,
  defineTool,
  type InputSchemaMetaType,
  type OutputSchemaMetaType,
  type SecretSchemaMetaType
} from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const secretSchema = z.object({
  apiKey: z.string().min(1).meta({
    title: 'API Key',
    isSecret: true
  } satisfies SecretSchemaMetaType)
});

const handler = createToolHandler({
  inputSchema: z.object({
    query: z.string().min(1).meta({
      title: 'Query',
      description: 'Search keyword',
      isToolParams: true
    } satisfies InputSchemaMetaType)
  }),
  outputSchema: z.object({
    result: z.string().meta({
      title: 'Result'
    } satisfies OutputSchemaMetaType)
  }),
  secretSchema,
  handler: async (input, ctx) => {
    return {
      result: input.query
    };
  }
});

export default defineTool({
  manifest: {
    pluginId: 'example-search',
    version: '1.0.0',
    name: {
      en: 'Example Search',
      'zh-CN': '示例搜索'
    },
    description: {
      en: 'Search example data',
      'zh-CN': '搜索示例数据'
    },
    versionDescription: {
      en: 'Initial version',
      'zh-CN': '初始版本'
    }
  },
  handler
});
```

Core rules:

- Keep `pluginId`, child tool `id`, input field names, and output field names stable after publishing.
- Use `{ en, 'zh-CN' }` for `manifest.name`, `manifest.description`, and `versionDescription`.
- Describe inputs, outputs, and secrets with Zod schemas.
- Add `InputSchemaMetaType` to input fields and set `isToolParams: true` for parameters recommended to be managed by AI; add `OutputSchemaMetaType` to output fields.
- Add `SecretSchemaMetaType` to secret fields and set `isSecret: true` for sensitive fields.
- Handler return values must match `outputSchema`.
- Convert external API errors into actionable messages and avoid exposing secrets, tokens, or complete sensitive responses.
- Use `ctx.invoke.uploadFile()` when host file upload is needed, and prefer preserving the returned `err`.
- Use `ctx.streamResponse()` when progress should be shown to users.

For tool suites, use `defineToolSet()`. Put shared information in the top-level `manifest` and `secretSchema`, and declare each child tool's independent `id`, name, description, and handler in `children`.

### 4. Icon Conventions

During build, the CLI scans icons in the plugin root and writes them into the built `manifest.json`.

| Scenario | File name |
| --- | --- |
| Main plugin icon | `logo.svg`, `logo.png`, `logo.jpg`, `logo.jpeg`, `logo.webp`, or `logo.gif` |
| Tool-suite child icon | `<childId>.logo.svg`, `<childId>.logo.png`, and similar names |

Notes:

- Put icon files in the plugin root.
- The `<childId>` of a child icon must exactly match `children[].id`.
- Keep only one extension for the same icon to avoid ambiguous scan results.
- Child tools without their own icons reuse the main plugin icon by default.
- After build, check the `icon` field in `dist/manifest.json`.

### 5. Local Debugging

Install dependencies in the plugin directory first:

```bash
cd packages/tools/my-tool
pnpm install
```

View plugin and debuggable tool information:

```bash
pnpx @fastgpt-plugin/cli debug .
```

Run one single-tool debug invocation:

```bash
pnpx @fastgpt-plugin/cli debug . --run --input '{"query":"hello"}' --secrets '{"apiKey":"test"}'
```

Run a child tool in a tool suite:

```bash
pnpx @fastgpt-plugin/cli debug . --run --tool search --input '{"query":"hello"}' --secrets '{"apiKey":"test"}'
```

Use files when input, secrets, or system variables are large:

```bash
pnpx @fastgpt-plugin/cli debug . --run --input-file input.json --secrets-file secrets.json --system-var-file system-var.json
```

Local debug boundaries:

- `ctx.invoke.uploadFile()` uses a local mock implementation and defaults to `.fastgpt-plugin-debug/uploads`.
- Local debug does not simulate the production child-process pool, real Node.js IPC, network environment, server timeout, or queue scheduling.
- Reverse host invocation is suitable only for validating plugin-side parameters and error handling.
- Before listing official plugins, still manually install plugins in a test environment and complete end-to-end testing.

### 6. Build, Check, And Pack

Inside a plugin directory, usually run:

```bash
pnpm run test
pnpm run build
pnpx @fastgpt-plugin/cli check --entry . --output ./dist
pnpm run pack
```

You can also pass directories explicitly:

```bash
pnpx @fastgpt-plugin/cli build --entry packages/tools/my-tool --output packages/tools/my-tool/dist --minify
pnpx @fastgpt-plugin/cli check --entry packages/tools/my-tool --output packages/tools/my-tool/dist
pnpx @fastgpt-plugin/cli pack --entry packages/tools/my-tool --dist ./dist --output packages/tools/my-tool/out
```

Build artifacts should include:

- `dist/index.js`
- `dist/manifest.json`
- icon files
- optional `README.md`
- optional `assets/**`

Packaging produces a `.pkg` file. Uploading, installation, and listing should all use that `.pkg` file.

### 7. Verification Checklist

Before submitting, confirm:

- `index.ts` default export is correct.
- `manifest.pluginId`, `manifest.version`, Chinese and English names, and descriptions are complete.
- Tool suite `children[].id` values are stable and unique.
- `inputSchema` covers all user inputs and includes required type and range constraints.
- `outputSchema` matches handler return values.
- `secretSchema` covers all secret configuration and sensitive fields set `isSecret: true`.
- External API success, failure, empty response, timeout, and auth failure are handled.
- Error messages help locate issues and do not leak secrets or sensitive responses.
- `pnpm run test` passes, or the reason it cannot be tested is documented.
- `build`, `check`, and `pack` pass.
- Icons and schemas in `dist/manifest.json` are as expected.
- `.pkg` can be installed in a test environment and complete a real invocation.

## Release Flow

### Community Plugins

Community repositories usually reference third-party plugin repositories under `packages/`. After development, create and push an independent GitHub repository from the plugin directory:

```bash
cd packages/tools/my-tool
git init
git add .
git commit -m "feat: add my-tool plugin"
gh repo create --public --source=. --remote=origin --push
```

Then return to the `fastgpt-community-plugins` repository, submit the submodule or reference update, and open a PR to `labring/fastgpt-community-plugins`.

### Official Plugins

Official plugins require:

1. Code review.
2. Build, check, test, and package.
3. Manual `.pkg` installation in a test environment.
4. Complete functional testing, including external APIs, secret configuration, error paths, and concurrent calls.
5. Pre-listing security checks, focusing on SSRF, secret leakage, arbitrary file access, command execution, and dependency risk.

### Business Plugins

Business plugins are released to private repositories. Manage versions, secrets, installation packages, and acceptance records according to the customer delivery process. Security boundaries for external APIs, customer private addresses, and account secrets should be recorded separately.

## FAQ

### How should I choose between `tool` and `tool-suite`?

Use `tool` for a single capability. Use `tool-suite` for multiple capabilities that share authentication, the same upstream API, and strong business relevance, such as search, detail, and task creation in one plugin.

### How should plugin versions be managed?

Use semantic versioning for `manifest.version`. Upgrade patch for compatible fixes, minor for compatible new features, and major when changing input/output fields, child tool IDs, or user configuration. Evaluate existing workflow compatibility before major changes.

### Can I put API keys in code or environment variables?

Plugins should declare secrets through `secretSchema` and read them through `ctx.secrets`. Real secrets should not appear in code repositories, test snapshots, error logs, or README files.

### Is a test environment still needed after local debug passes?

Yes. Local debug quickly validates plugin logic and schemas. Test environment validation confirms real installation, runtime, host reverse invocation, network, and permission behavior.

### Why is the file named `how-to-devlop-plugin.md`?

The current filename keeps the historical spelling to avoid breaking existing links. It can later migrate to `how-to-develop-plugin.md` during a unified documentation reference update, with a redirect or compatibility entry kept.

## References

- [FastGPT Plugin System Design](./design.md)
- [FastGPT Plugin Architecture](./architecture.md)
- [FastGPT Plugin SDK Factory](../../sdk/factory/README.en.md)
- [System Tool Development Skill](../../sdk/factory/skills/fastgpt-system-tool-development/SKILL.md)
- [local-pool Runtime Design](./process-pool-design.md)
