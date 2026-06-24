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
  - Supports a Connection Gateway TCP remote-debug channel, including multiple local plugins mounted on one channel.
- **Packaging**
  - Provides the `pack` command to package `dist` artifacts into an uploadable `.pkg`.

### Remote Debugging

Local plugins can connect to a test-environment plugin-server through a FastGPT connect link. The recommended path is for FastGPT to authenticate the user and create the debug session, while the CLI only exchanges a one-time ticket for short-lived connection info.

```bash
fastgpt-plugin debug ./plugins/getTime ./plugins/dbops \
  --connect "https://fastgpt.example.com/debug-plugin/connect?ticket=..."
```

The connect link returns the gateway TCP endpoint, `debug:tmbId:{tmbId}:session:{debugSessionId}` source, precreated session, and scoped connect token. The CLI does not need `CONNECTION_GATEWAY_AUTH_TOKEN` or `JWT_SECRET`.

For low-level local integration, the CLI can still connect to Connection Gateway directly:

```bash
fastgpt-plugin debug ./plugins/getTime ./plugins/dbops \
  --gateway \
  --gateway-base-url https://connection-gateway.example.com \
  --gateway-tcp-url tcp://connection-gateway-tcp.example.com:3012 \
  --gateway-auth-token "$CONNECTION_GATEWAY_AUTH_TOKEN" \
  --gateway-jwt-secret "$JWT_SECRET" \
  --gateway-user-id u1
```

The default source is `debug:user:{userId}`. One CLI process creates one TCP channel and mounts all plugin entries passed to the command. Reconnect is enabled by default, and a normal shutdown deletes the gateway session. Use `--gateway-no-reconnect` to disable reconnect.

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
