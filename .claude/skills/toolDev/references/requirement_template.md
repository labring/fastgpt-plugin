# [Tool Name] Design Document

## 🔑 Reference Information
- API Documentation: [URL]
- Test Credentials: [Keys/Tokens]
- Related Issues/PRs: [Links]

## 🎯 Functionality Overview
Implement [clear description of what the tool does].

**Type**:
- [ ] Independent Tool
- [ ] ToolSet with N child tools

**Child Tools** (if toolset):
1. Tool 1: [Description]
2. Tool 2: [Description]
3. Tool N: [Description]

## 📁 Directory Structure
```
modules/tool/packages/[toolName]/
├── index.ts
├── config.ts
├── package.json
├── src/
│   └── index.ts
└── test/
    └── index.test.ts
```

## 🔧 Configuration Details

### Secret Inputs (if applicable)
- `apiKey`: API authentication key (required)
- `connectionString`: Service connection URL (optional)

### Input Parameters
| Key | Type | Required | Description | AI Description |
|-----|------|----------|-------------|----------------|
| `input1` | `string` | ✓ | User input description | "The text to process" |
| `count` | `number` | | Number of items (default: 10) | "How many items to return" |

### Output Parameters
| Key | Type | Description |
|-----|------|-------------|
| `result` | `string` | Processed result |
| `success` | `boolean` | Operation status |

## 💻 Implementation Approach

### Zod Schema
```typescript
export const InputType = z.object({
  apiKey: z.string().optional(),
  input1: z.string().min(1, 'Cannot be empty'),
  count: z.number().default(10)
});

export const OutputType = z.object({
  result: z.string(),
  success: z.boolean()
});
```

### Core Logic
```typescript
export async function tool(input: z.infer<typeof InputType>) {
  // Implementation logic
  const result = await processData(input);
  return { result, success: true };
}
```

## 🧪 Test Strategy
- **Unit Tests**: Input validation, business logic
- **Integration Tests**: API calls, database operations
- **Edge Cases**: Empty inputs, invalid data, timeouts
- **Error Scenarios**: Network failures, authentication errors

## ⚠️ Potential Issues & Review Points
- [ ] Rate limiting considerations
- [ ] Timeout handling for long operations
- [ ] Resource cleanup (connections, files)
- [ ] Error message clarity
- [ ] Security: No sensitive data in logs
