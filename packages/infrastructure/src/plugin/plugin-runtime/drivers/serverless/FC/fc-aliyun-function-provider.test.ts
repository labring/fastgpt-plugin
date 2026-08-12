import { describe, expect, it, vi } from 'vitest';

import { resolveFCClientConstructor } from './fc-aliyun-function-provider';

describe('resolveFCClientConstructor', () => {
  it('uses a directly imported client constructor', () => {
    const Client = vi.fn();

    expect(resolveFCClientConstructor(Client)).toBe(Client);
  });

  it('unwraps the CommonJS default export exposed by native ESM', () => {
    const Client = vi.fn();

    expect(resolveFCClientConstructor({ default: Client })).toBe(Client);
  });

  it('rejects an unsupported SDK export shape', () => {
    expect(() => resolveFCClientConstructor({})).toThrow(
      'Invalid @alicloud/fc20230330 client export'
    );
  });
});
