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

### Development Practices

#### 1. Use English comments
In the code, use English comments to explain the purpose of the code.

#### 2. Use English variable names
In some plugins, the variable names are not English for compatibility.

The new plugins should use English variable names.

#### 3. Wrtie Test Cases

Write test cases for the plugin.

We use [vitest](https://vitest.dev) for testing.

#### 4. Avoid Using Variables (let, var) as Much as Possible, Use const
"Immutable" variables improve code readability, help avoid issues caused by incorrect assignments, and are beneficial for TypeScript hints.

#### 5. Avoid Using any as Much as Possible

#### 6. Variable Scope
Try to use smaller variable scopes. Usually this can be done in two ways:

1. Use "block scope" syntax

```typescript
const foo = () => {
  {
    const bar = 1;
    console.log(bar); // 1
  }
  console.log(bar); // ReferenceError: bar is not defined
};
```

2. Use IIFE (Immediately Invoked Function Expression)
If a result needs to be exported to a larger scope, you can use IIFE syntax.

```typescript
const foo = () => {
  const bar = (()=>{
    const a = 1;
    const b = 2;
    return a + b;
  })();
  console.log(bar); // 3
  console.log(a); // ReferenceError: a is not defined
};
```

### System Built-in Utility Functions

The system has some built-in utility functions available under the directory `modules/tool/utils`.
You can import them in code using `import { xxx } from '@/tool/utils'`.

The list of utility functions includes:

- delay: delay
- getErrText: error handling
- htmlTable2Md: convert html table to markdown
- retryFn: retry function
- replaceSensitiveText: replace sensitive text
- request: request function
- GET: GET request
- POST: POST request
- PUT: PUT request
- DELETE: DELETE request
- PATCH: PATCH request
- createHttpClient: create custom http client
- getNanoid: generate unique id
- uploadFile: upload file to Minio
