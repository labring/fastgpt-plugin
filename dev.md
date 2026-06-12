# FastGPT Plugin Development Document

Language: [简体中文](./dev_zh_CN.md) | [English](./dev.md)

## Common Commands

### Install Dependencies

```bash
pnpm install
```

### Build

```bash
pnpm build:sdk-factory
pnpm build:sdk-client
pnpm build:cli
pnpm build:server
pnpm build:debug-runtime-monitor
```

### Development

```bash
pnpm dev:server
pnpm dev:cli
pnpm dev:debug-runtime-monitor
```

### Quality Checks

```bash
pnpm test
pnpm typecheck
pnpm lint
```

## Repository Structure

This repository is a pnpm workspace monorepo.

| Path | Purpose |
| --- | --- |
| `apps/server` | FastGPT Plugin HTTP service and route composition. |
| `apps/cli` | Plugin create, build, check, debug, and pack CLI. |
| `apps/debug-runtime-monitor` | Local runtime and Connection Gateway metrics monitor UI. |
| `packages/domain` | Entities, value objects, and port definitions. |
| `packages/usecase` | Application use cases for plugins, tools, models, and runtime metrics. |
| `packages/interface-adapter` | HTTP contracts, DTOs, and auth adapters. |
| `packages/infrastructure` | Hono, Mongo, S3, Redis, static data, logging, metrics, and plugin runtime implementations. |
| `packages/shared` | Cross-layer pure utilities. |
| `sdk/client` | Client SDK for calling the FastGPT Plugin service. |
| `sdk/factory` | SDK for authoring tool plugins. |
| `test` | Shared fixtures and cross-package test utilities. |

See [Architecture](./docs/dev/architecture.md) for the full layering model.

## Plugin Development

Use `@fastgpt-plugin/cli` and `@fastgpt-plugin/sdk-factory` for tool plugins.

```bash
pnpx @fastgpt-plugin/cli create my-tool --type tool --cwd packages/tools
pnpx @fastgpt-plugin/cli create my-tool-suite --type tool-suite --cwd packages/tools
```

Inside a plugin project:

```bash
pnpm run test
pnpm run build
pnpx @fastgpt-plugin/cli check --entry . --output ./dist
pnpm run pack
```

Useful references:

- [System Plugin Development Guide](./docs/dev/how-to-devlop-plugin.en.md)
- [SDK Factory Guide](./sdk/factory/README.en.md)
- [CLI Guide](./apps/cli/README.en.md)

## Development Practices

### 1. Use English Identifiers

Use English for variables, functions, files, and public API names. Keep legacy non-English identifiers only when required for compatibility.

### 2. Keep Layer Boundaries Clear

Follow the existing dependency direction:

1. Define stable business types and ports in `packages/domain`.
2. Implement orchestration in `packages/usecase`.
3. Put DTOs and OpenAPI contracts in `packages/interface-adapter`.
4. Implement framework, storage, runtime, and external-service details in `packages/infrastructure`.
5. Wire concrete dependencies in `apps/server/src/deps.ts` and route files.

### 3. Write Tests

Use [Vitest](https://vitest.dev) for tests. Prefer focused tests near the code being changed:

- Usecase tests should mock ports.
- Infrastructure tests should isolate external IO and cover serialization, error mapping, and security constraints.
- CLI changes should cover command behavior and generated artifacts.
- SDK changes should cover TypeScript-facing API behavior and runtime channel behavior.

### 4. Prefer `const`

Use `const` by default. Use `let` only when a variable is intentionally reassigned.

### 5. Avoid `any`

Prefer explicit types, Zod schemas, and domain value objects. Use `unknown` at boundaries and parse before use.

### 6. Keep Scope Small

Keep variables and helper functions close to where they are used. Extract helpers when they clarify business intent or remove meaningful duplication.

## Model Presets

Model provider presets now live under `packages/infrastructure/src/static-data/models/provider`.

To add or update a model provider:

1. Update or add the provider config in `packages/infrastructure/src/static-data/models/provider/<Provider>/index.ts`.
2. Add or update the provider logo in the same directory when needed.
3. Add channel avatars under `packages/infrastructure/src/static-data/models/channel-avatar` when needed.
4. Register new providers in `packages/infrastructure/src/static-data/models/index.ts`.
5. Run tests or typecheck for the affected package.

## Runtime And Operations

- Local-pool runtime design: [process-pool-design.md](./docs/dev/process-pool-design.md)
- Runtime metrics and OpenTelemetry: [runtime-metrics-otel.md](./docs/dev/runtime-metrics-otel.md)
- Upgrade guide: [v1.0.0.md](./docs/upgrade/v1.0.0.md)
