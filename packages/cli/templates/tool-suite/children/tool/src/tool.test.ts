import { describe, it, expect } from 'vitest';
import { tool } from './tool';
import { InputType, OutputType } from './schemas';

describe('{{name}} child tool', () => {
  it('should run with valid IO schemas', async () => {
    const input = InputType.parse({});
    const result = await tool(input, {
      systemVar: {
        user: {
          id: 'test',
          username: 'test',
          contact: 'test',
          membername: 'test',
          teamName: 'test',
          teamId: 'test',
          name: 'test'
        },
        app: {
          id: 'test',
          name: 'test'
        },
        tool: {
          id: 'test',
          version: '0.0.1'
        },
        time: new Date().toISOString()
      },
      streamResponse: () => {
        // noop
      }
    });

    const output = OutputType.parse(result);
    expect(output).toBeDefined();
  });
});
