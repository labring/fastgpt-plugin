# FastGPT Tool Design Template

Use this as a short DESIGN.md or implementation note before building a new tool.

## Summary

- Tool or toolset name:
- Standalone tool or toolset:
- Existing local pattern to follow:
- External API/docs:
- Required credentials:

## Scope

- User-facing capability:
- Out of scope:
- Child tools, if any:

## Config Contract

### Secret Inputs

| key | required | source | notes |
| --- | --- | --- | --- |
| `apiKey` | yes | toolset secret | Example only |

### Inputs

| key | valueType | renderTypeList | required | default | toolDescription |
| --- | --- | --- | --- | --- | --- |
| `query` | `string` | `input`, `reference` | yes | | Search query |

### Outputs

| key | valueType | description |
| --- | --- | --- |
| `result` | `string` | Main result |

## Runtime Design

- `InputType` Zod schema:
- `OutputType` Zod schema:
- Core API/client calls:
- Known business errors to return structurally:
- Resources that require `finally` cleanup:
- Bun/Node v22 compatibility notes:

## Tests

- Input validation cases:
- Successful business path:
- Known API/auth error path:
- Resource cleanup or timeout behavior:
- Mocking strategy:

## Validation

- `node .agents/skills/tool-dev/scripts/validate_tool_package.mjs modules/tool/packages/<toolName>`
- `bun run test -- modules/tool/packages/<toolName>/test/index.test.ts`
- `bun run build:pkg` when package exports or config wiring changed
