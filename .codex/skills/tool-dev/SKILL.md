---
name: tool-dev
description: Develop FastGPT plugin system tools and toolsets in modules/tool/packages with repo-specific structure, Zod input/output schemas, FastGPT config files, shared toolset secrets, Bun/Node v22 compatibility, and Vitest validation. Use when creating or modifying FastGPT tools, child tools, API integrations, tool configs, package wiring, tests, or design docs in this repository.
---

# FastGPT Tool Development

Use this skill when implementing or reviewing FastGPT plugin tools under `modules/tool/packages`.

## Workflow

1. Inspect nearby tools before editing.
   - Use `modules/tool/packages/delay` for a small standalone tool.
   - Use `modules/tool/packages/redis` or `modules/tool/packages/feishuBitable` for toolset and child-tool patterns.
   - Read `modules/tool/type/index.ts`, `modules/tool/type/fastgpt.ts`, and `modules/tool/type/tool.ts` only when config fields are unclear.

2. Decide the shape.
   - Standalone tool: `modules/tool/packages/<toolName>/config.ts`, `src/index.ts`, `index.ts`, `package.json`, optional `test/index.test.ts`.
   - Toolset: parent `config.ts`, parent `index.ts`, shared `client.ts`/`utils.ts` if needed, and child tools under `children/<childName>/`.
   - Put provider credentials in `secretInputConfig`. Child tools inherit parent toolset secrets through their `InputType`.

3. Implement config and runtime together.
   - `config.ts` declares UI/AI-facing inputs and outputs with `defineTool` or `defineToolSet`.
   - `src/index.ts` exports `InputType`, `OutputType`, and `tool`.
   - `index.ts` wires `config`, schemas, and callback through `exportTool`; parent toolsets use `exportToolSet`.
   - Use standard Node.js APIs, ESM imports, and `fetch`/cross-platform libraries. Avoid Bun-only APIs in runtime code.
   - Keep package dependencies minimal and local to the package that needs them. Do not edit `dist` or generated marketplace output while implementing source changes.

4. Keep error handling narrow.
   - Do not wrap the whole tool in a top-level `try/catch`.
   - Let unexpected errors throw to the framework.
   - Return structured business errors only for known API/auth failures that are part of the tool contract.
   - Use `try/finally` only when a resource must be closed; do not add a catch just to rethrow.

5. Validate with repo commands.
   - Run targeted tests with `bun run test -- <path/to/test>`.
   - Run the full suite with `bun run test` when the change touches shared behavior.
   - Use `bun run build:pkg` for package/build wiring and `bun run build:runtime` for production runtime confidence.
   - Do not use `bun test`; this repo routes tests through Vitest via `bun run test`.

## References

- Load `references/design_spec.md` for config/schema/code examples, directory patterns, validation guidance, and review checklist.
- Load `references/requirement_template.md` when drafting a tool design or DESIGN.md before implementation.

## Scripts

- `scripts/validate_tool_package.mjs <tool-package-dir>` checks package structure, required exports, config wiring, Zod schemas, and forbidden runtime patterns.

Run it before final validation for new or heavily edited tool packages:

```bash
node .agents/skills/tool-dev/scripts/validate_tool_package.mjs modules/tool/packages/<toolName>
```

Treat script errors as blockers. Treat warnings as review prompts because some existing tools intentionally keep legacy aliases, compatibility outputs, or explicit catch handling.
