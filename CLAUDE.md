# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FastGPT-plugin is a modular plugin system for FastGPT that provides extensible tools and model providers. The system is built with TypeScript, Express.js, and Bun, focusing on modularity and hot-swappable plugins.

## Core Architecture

### Main Components

- **Express Server** (`src/index.ts`): Main application entry point that initializes modules, S3, OpenAPI docs, and router
- **Worker System** (`src/worker/`): Thread-based tool execution using Node.js worker_threads for isolated plugin execution
- **Module System**: Two main module types:
  - **Tools** (`modules/tool/`): Executable plugins with individual functionality
  - **Models** (`modules/model/`): Model provider configurations for various LLM providers

### Module Structure

**Tools Module** (`modules/tool/`):
- Tools can be standalone or toolsets with children
- Each tool has: config, index, src/, test/, package.json
- Tools support streaming responses via worker threads
- Hot-reload in development mode

**Models Module** (`modules/model/`):
- Provider configurations for 25+ LLM providers (OpenAI, Claude, Gemini, etc.)
- Centralized model definitions with capabilities (toolCall, classification, etc.)
- Provider-specific implementations in `provider/` directory

## Development Commands

### Setup
```bash
bun install
```

### Development
```bash
bun run dev          # Development mode with hot reload
```

### Building
```bash
bun run build        # Full build with TypeScript compilation
bun run build:no-tsc # Build without TypeScript check
bun run build:main   # Build main server only
bun run build:worker # Build worker only
```

### Testing & Quality
```bash
bun run test         # Run test suite with Vitest
bun run lint         # ESLint with auto-fix
bun run prettier     # Code formatting
```

### Tools
```bash
bun run new:tool     # Generate new tool from template
```

### Production
```bash
bun run start        # Start production server (after build)
```

## Tool Development

### Tool Structure
- **Standalone Tools**: Single functionality (e.g., `delay`, `getTime`)
- **Toolsets**: Multiple related tools under one parent (e.g., `duckduckgo` with search, images, news)

### Tool Files
- `config.ts`: Tool metadata and input/output schemas
- `index.ts`: Tool export and configuration
- `src/index.ts`: Main implementation with callback function
- `test/index.test.ts`: Test cases

### Creating New Tools
Use `bun run new:tool` to generate from templates:
- `tool`: Standalone tool template
- `toolSet`: Toolset with children template

### Built-in Utilities
Available via `import { xxx } from '@tool/utils'`:
- `delay`, `getErrText`, `htmlTable2Md`, `retryFn`
- `request`, `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- `createHttpClient`, `getNanoid`, `uploadFile`

## Key Development Patterns

### Tool Execution Flow
1. Main process receives tool request
2. Worker thread spawns for isolated execution
3. Tool callback executes with streaming support
4. Results returned via worker message passing

### Module Loading
- Development: Dynamic import from `modules/tool/packages/`
- Production: Static loading from `dist/tools/`
- Auto-discovery of tool directories

### Path Aliases
```typescript
"@/*": ["./src/*"]
"@tool/*": ["modules/tool/*"] 
"@model/*": ["modules/model/*"]
```

## Testing

- **Framework**: Vitest with coverage reporting
- **Setup**: `test/setup.ts` for global configuration
- **Coverage**: Focuses on `runtime/**/*.ts` and `modules/**/src/*.ts`
- **Patterns**: Tests located alongside source in `test/` directories

## Environment Configuration

### Required Environment Variables
- `PORT`: Server port (default: 3000)
- `TOOLS_DIR`: Production tools directory
- S3 configuration for file uploads
- OpenTelemetry/Signoz configuration for monitoring

### Development vs Production
- Development: Hot reload, dynamic tool loading from source
- Production: Pre-built tools, optimized bundles, static file serving

## Security & Best Practices

- Worker thread isolation for tool execution
- Input validation using Zod schemas
- Error handling with structured error messages
- OpenTelemetry integration for monitoring
- Express security middleware

## SDK & Client Integration

- Separate SDK package (`sdk/`) for external integration
- Client-side utilities for FastGPT integration
- Stream handling for real-time tool responses