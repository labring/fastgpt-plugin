import { describe, it, expect } from 'vitest';
import { tool } from '../src/index.js';

describe('my-tool', () => {
  it('should run', async () => {
    const result = await tool({});
    expect(result).toBeDefined();
  });
});
