# FastGPT Tool Design Reference

## Directory Patterns

Standalone tool:

```text
modules/tool/packages/<toolName>/
├── config.ts
├── index.ts
├── package.json
├── src/
│   └── index.ts
└── test/
    └── index.test.ts
```

Toolset:

```text
modules/tool/packages/<toolsetName>/
├── config.ts
├── index.ts
├── package.json
├── client.ts
├── utils.ts
└── children/
    └── <childName>/
        ├── config.ts
        ├── index.ts
        ├── src/
        │   └── index.ts
        └── test/
            └── index.test.ts
```

Use camelCase package and child names unless an existing provider name already uses another local convention.

## Config Files

Standalone `config.ts`:

```typescript
import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  tags: [ToolTagEnum.enum.tools],
  name: {
    'zh-CN': '工具名称',
    en: 'Tool Name'
  },
  description: {
    'zh-CN': '工具描述',
    en: 'Tool description'
  },
  toolDescription: 'Describe when and how the AI should use this tool.',
  secretInputConfig: [
    {
      key: 'apiKey',
      label: 'API Key',
      description: 'Service API key',
      required: true,
      inputType: 'secret'
    }
  ],
  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'query',
          label: '查询',
          description: '查询内容',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The query to send to the service'
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '结果',
          description: '返回结果',
          valueType: WorkflowIOValueTypeEnum.string
        }
      ]
    }
  ]
});
```

Toolset parent `config.ts`:

```typescript
import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': '工具集名称',
    en: 'Toolset Name'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN': '工具集描述',
    en: 'Toolset description'
  },
  toolDescription: 'Describe the shared service and child capabilities.',
  secretInputConfig: [
    {
      key: 'apiKey',
      label: 'API Key',
      description: 'Shared service API key',
      required: true,
      inputType: 'secret'
    }
  ]
});
```

Only add `toolDescription` on inputs that the AI must fill dynamically. Human-only selects and switches often do not need it.

## Runtime Files

Standalone `src/index.ts`:

```typescript
import { z } from 'zod';

export const InputType = z.object({
  apiKey: z.string().min(1, 'API Key is required'),
  query: z.string().min(1, 'Query cannot be empty')
});

export const OutputType = z.object({
  result: z.string()
});

export async function tool({
  apiKey,
  query
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const response = await fetch('https://api.example.com/search', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    return { result: `Request failed: ${response.status}` };
  }

  const data = await response.json();
  return { result: JSON.stringify(data) };
}
```

Prefer exporting both schemas from `src/index.ts`. Existing tools may place shared schemas such as `OutputType` in `src/type.ts` and re-export/import them through `index.ts`; follow that only when it meaningfully reduces duplication.

Standalone `index.ts`:

```typescript
import config from './config';
import { InputType, OutputType, tool as toolCb } from './src';
import { exportTool } from '@tool/utils/tool';

export default exportTool({
  toolCb,
  InputType,
  OutputType,
  config
});
```

Toolset parent `index.ts`:

```typescript
import config from './config';
import { exportToolSet } from '@tool/utils/tool';

export default exportToolSet({
  config
});
```

Child tools use the same `index.ts` shape as standalone tools. Child `InputType` must include shared parent secret fields, such as `apiKey`, when the child runtime needs them.

## Error Handling

Do not add top-level catch blocks that convert every exception into a string. Let the framework handle unexpected failures.

Use this shape for known business errors:

```typescript
if (!response.ok) {
  return {
    error_message: `Service request failed: ${response.status}`
  };
}
```

Use `try/finally` only for resource cleanup:

```typescript
export async function tool(input: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const client = await createClient(input.apiKey);
  try {
    const value = await client.get(input.key);
    return { value };
  } finally {
    await client.close();
  }
}
```

## Compatibility

Runtime code must work in Bun development and Node.js v22 production.

- Use `node:fs/promises`, `node:path`, and standard Web APIs.
- Do not use `Bun.file`, `Bun.write`, `Bun.env`, or `Bun.fetch` in tool runtime.
- Prefer ESM imports and existing repo aliases.
- Keep generated/build output out of source edits.
- Add only package-level dependencies that the tool actually imports.
- Keep secrets out of tests, logs, snapshots, and DESIGN.md. Use environment variables or clearly marked placeholders.

## Testing

Use Vitest through package scripts:

```bash
bun run test -- modules/tool/packages/<toolName>/test/index.test.ts
bun run test
```

Do not use `bun test`.

Test checklist:

- Zod rejects invalid inputs.
- Successful path returns `OutputType` shape.
- Known API/auth failures return the documented structured error.
- Shared toolset secrets are accepted by child tools.
- Resource cleanup runs when client operations throw.

## Review Checklist

- `config.ts` input/output keys match `InputType` and `OutputType`.
- `index.ts` exports `exportTool` or `exportToolSet` correctly.
- `package.json` has package-local `build` script and required dependencies.
- No top-level catch-all error swallowing.
- No Bun-only runtime APIs.
- Tests use `bun run test`.

The validation script reports key mismatches as warnings, not hard errors, because existing tools may keep legacy aliases or compatibility-only outputs. For new tools, resolve those warnings unless there is a clear compatibility reason.
