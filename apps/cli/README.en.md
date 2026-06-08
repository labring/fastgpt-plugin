## @fastgpt-plugin/cli

Language: [简体中文](./README.md) | [English](./README.en.md)

Command-line tool for FastGPT plugin development. It is used to create, build, test, debug, and package FastGPT tools and tool suites.

### Features

- **Unified build flow**
  - Uses `tsdown` to build TypeScript source into Node 22-compatible `dist` artifacts with one command.
  - Automatically generates d.ts type declarations for references from other packages.
- **Tool and tool-suite specific build**
  - Supports a tool directory as the entry, including files such as `config.ts` and `index.ts`.
  - Applies AST transforms to `config.ts` in a temporary directory and automatically injects required metadata such as `toolId` and version.
  - Recursively copies source directories while skipping `node_modules`, `dist`, `.build-*`, and similar folders.
- **Safe build behavior**
  - Does not call `process.exit` during build. Errors are thrown as exceptions so upper-level scripts can handle them uniformly.
  - Automatically creates a temporary build directory and cleans it after build.
- **Test-friendly**
  - Includes Vitest configuration for unit-testing build logic.
  - Skips bundling some dependencies in the test environment, making builds faster and more stable.
- **Plugin scaffolding**
  - Provides the `create` command for generating single-tool or tool-suite projects.
  - Templates include `index.ts`, `package.json`, `tsconfig.json`, `vitest.config.ts`, `README.md`, and `logo.svg`.
- **Local debugging**
  - Provides the `debug` command to inspect plugin and child-tool information.
  - Supports running tools directly, passing input/secrets/systemVar files, and simulating `uploadFile` with a local directory.
- **Packaging**
  - Provides the `pack` command to package `dist` artifacts into an uploadable `.pkg`.

### TODO

- **Publish capabilities**
  - Provide `cli publish` to publish built tool packages to npm or an internal artifact registry.
  - Read versions from `config.ts` / `package.json` and validate duplicate versions.
  - Integrate changelog generation and git tag flow.
  - Provide an optional dry-run mode that only prints planned operations.
  - Support custom npm registry and token configuration through environment variables or config files.
- **Developer experience improvements**
  - `watch` mode: rebuild automatically when source files change.
  - Friendlier build logs and error messages.
