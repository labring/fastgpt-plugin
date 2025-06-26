import { expect, test, vi } from 'vitest';
import { tool } from '../src';

test('test', async () => {
  const result = await tool({
    query: 'test'
  });
  console.log(result);
});
