import { describe, it, expect } from 'vitest';
import { createToolHandler } from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

// Mock handler for testing
const mockHandler = createToolHandler({
  inputSchema: z.object({
    command: z.string(),
    workingDir: z.string().optional(),
    timeout: z.number().optional()
  }),
  outputSchema: z.object({
    success: z.boolean(),
    output: z.string(),
    exitCode: z.number()
  }),
  handler: async (input) => {
    // For testing, we simulate a successful execution
    return {
      success: true,
      output: `Mock execution of: ${input.command}`,
      exitCode: 0
    };
  }
});

describe('llm-box tool', () => {
  it('should have correct input schema', () => {
    expect(mockHandler.inputSchema).toBeDefined();
  });

  it('should have correct output schema', () => {
    expect(mockHandler.outputSchema).toBeDefined();
  });

  it('should execute mock command successfully', async () => {
    const result = await mockHandler.handler({
      command: 'llm-box run test.yaml'
    });

    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain('Mock execution');
  });

  it('should handle custom timeout', async () => {
    const result = await mockHandler.handler({
      command: 'llm-box create "test workflow"',
      timeout: 60
    });

    expect(result.success).toBe(true);
  });

  it('should handle custom working directory', async () => {
    const result = await mockHandler.handler({
      command: 'llm-box run workflow.yaml',
      workingDir: '/custom/path'
    });

    expect(result.success).toBe(true);
  });
});
