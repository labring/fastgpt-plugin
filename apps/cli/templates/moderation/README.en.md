# {{name}}

{{description}}

Language: [English](./README.en.md) | [简体中文](./README.zh-CN.md)

This is a **content moderation (`moderation`)** plugin that maps a provider's moderation API into FastGPT's standardized result contract.

## Quick Start

```bash
pnpm install
pnpm run dev
pnpm run debug
pnpm run debug:run
pnpm run build
pnpm run check
pnpm run test
pnpm run pack
```

`pnpm run dev` starts the remote FastGPT integration debug session with watch
mode enabled. Paste the FastGPT connection key when prompted, or pass one
directly:

```bash
fastgpt-plugin dev . --watch --connect '<connection-key-or-connect-link>'
```

`pnpm run debug` prints the plugin manifest, schema, and debug commands.
`pnpm run debug:run` executes one moderation check with sample JSON input:

```bash
npx @fastgpt-plugin/cli debug . --run --input '{"content":"hello world"}'
```

## What This Template Does

This template is an **offline keyword moderation provider** demonstrating the standard contract shape:

- `secretSchema` declares two fields via `defineSecretSchema()`: `blockedKeywords` (matching triggers `block`) and `suspiciousKeywords` (matching triggers `suspected`), comma-separated.
- `provider.check` returns `{ verdict, hits }`, where each hit includes `label`, `providerLabel`, and `keywords`. The SDK automatically derives the deduplicated top-level `result.keywords` union and `result.provider`.
- The template **omits `score`**: keyword matching has no probability score. `score` must only be populated with genuine provider confidence values (e.g., Tencent `Score`, Alibaba Cloud `Confidence`).

## Verdict Levels

`verdict` has four levels: `pass` / `block` / `suspected` / `error`.

- Keep `suspected` (provider flagged content for review) distinct from `error` (provider failed to produce a verdict due to timeout or upstream failure).
- When the provider cannot produce a verdict, **return `verdict: 'error'`** instead of throwing an uncaught exception. Uncaught exceptions are treated as framework-level plugin bugs rather than upstream service errors.
- FastGPT's moderation policy decides whether to pass, block, or replace content based on `verdict`.

## Documentation & I18n

Plugins support multi-language README documentation in the project root:

- `README.md`: Default / fallback documentation.
- `README.en.md`: English documentation.
- `README.zh-CN.md`: Simplified Chinese documentation.
- `README.zh-Hant.md`: Traditional Chinese documentation.

Filenames are strictly case-sensitive. The display client prioritizes the active user locale, falling back to Simplified Chinese (`zh-CN`), English (`en`), and finally `README.md`.

## Output

- `pnpm run build` writes `dist/index.js`, `dist/manifest.json`, copied logos, and optional static files (including localized README files).
- `pnpm run check` validates the build output before upload.
- `pnpm run pack` creates a `.pkg` file that can be uploaded to FastGPT Plugin.

## Dependency Mode

This project was generated with `{{dependencyMode}}` dependencies.

- `semver` uses published npm versions and works as a standalone plugin project.
- `catalog` is for pnpm workspace repositories that define matching catalog entries, such as the official plugin repository.

```bash
npx @fastgpt-plugin/cli create my-moderation --type moderation --dependency-mode catalog
```

## Troubleshooting

- Missing `index.ts`: run commands from the plugin project root, or pass `--entry <plugin-dir>`.
- Invalid JSON input: wrap input in a JSON object, for example `--input '{"content":"hello"}'`.
- Need a stack trace: rerun the command with `--verbose`.
