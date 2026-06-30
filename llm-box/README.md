# llm-box

Execute llm-box workflows and commands directly from FastGPT.

## Overview

[llm-box](https://github.com/alib8b8/llm-box) is a terminal-first AI workflow engine. This FastGPT plugin allows you to execute llm-box workflows and commands within your FastGPT applications.

## Features

- Execute YAML workflows
- Create workflows from natural language
- Run AI-powered automation tasks
- Support for multiple LLM providers (DeepSeek, Qwen, Kimi, GLM, etc.)

## Usage

### In FastGPT Workflow

Add the llm-box tool to your workflow and configure the command:

**Run a workflow file:**
```yaml
llm-box run examples/basic_summary.yaml
```

**Create a workflow from description:**
```yaml
llm-box create "fetch example.com and summarize the content"
```

**List available examples:**
```yaml
llm-box run examples/multi_step.yaml
```

### Prerequisites

Make sure llm-box is installed on your system:

```bash
# Linux/macOS
curl -fsSL https://raw.githubusercontent.com/alib8b8/llm-box/main/install.sh | bash

# Or download from GitHub Releases
```

## API Reference

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| command | string | Yes | The llm-box command to execute |
| workingDir | string | No | Working directory for the command |
| timeout | number | No | Timeout in seconds (default: 120) |

### Output

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether the command executed successfully |
| output | string | Command stdout/stderr output |
| exitCode | number | Command exit code |

## Examples

### Example 1: Summarize Web Content

Input:
```
command: "run https://example.com"
```

### Example 2: Process Local File

```
command: "create summarize document.txt and save to summary.txt"
```

### Example 3: Batch Processing

```
command: "run examples/batch_process.yaml"
```

## Related

- [llm-box GitHub](https://github.com/alib8b8/llm-box)
- [llm-box Documentation](https://github.com/alib8b8/llm-box#readme)
- [FastGPT](https://github.com/labring/FastGPT)

## License

MIT
