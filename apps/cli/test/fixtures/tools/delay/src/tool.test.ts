import { describe, expect, it } from 'vitest';
import { InputSchema, OutputSchema } from './schemas';
import { tool } from './tool';
import { mockedEventEmitter, mockedSystemVar } from '@fastgpt-plugin/helpers/tools/mocks';

describe('get-time', () => {
  it('should run with valid IO schemas', async () => {
    const input = InputSchema.parse({});
    const result = await tool(input, {
      systemVar: mockedSystemVar,
      emitter: mockedEventEmitter
    });

    const output = OutputSchema.parse(result);
    expect(output).toBeDefined();
  });
});
