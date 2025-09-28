import { expect, test } from 'vitest';
import tool from '..';

test(async () => {
  expect(tool.name).toBeDefined();
  expect(tool.description).toBeDefined();
  expect(tool.cb).toBeDefined();

  const v = tool.versionList?.[0];
  expect(v).toBeDefined();
  const inputKeys = (v?.inputs || []).map((i: any) => i.key);
  const outputKeys = (v?.outputs || []).map((o: any) => o.key);
  expect(inputKeys).toContain('base64');
  expect(outputKeys).toContain('url');
  expect(outputKeys).toContain('type');
  expect(outputKeys).toContain('size');
});
