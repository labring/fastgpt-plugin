# FastGPT-plugin Devlopment Document


## Common Commands

### install dependencies

```bash
bun install
```

### build

```bash
bun run build
```

### run

- dev mode
```bash
bun run dev
```

In dev mode, the worker will be rebuilt every time you save the file (hot reload).

- prod mode (after build)
```bash
bun run prod
```

## Development

Link the sdk to fastgpt:

under the FastGPT/packages/service directory:

```
pnpm link xxxx/fastgpt-plugin/sdk
```

This command will not update the package.json file.

### Development habits

#### 1. Use English comments
In the code, use English comments to explain the purpose of the code.

#### 2. Use English variable names
In some plugins, the variable names are not English for compatibility.

The new plugins should use English variable names.

#### 3. Wrtie Test Cases

Write test cases for the plugin.

We use [vitest](https://vitest.dev) for testing.
