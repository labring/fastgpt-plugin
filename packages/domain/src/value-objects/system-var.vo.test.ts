import { describe, expect, it } from 'vitest';

import { SystemVarSchema } from './system-var.vo';

describe('SystemVarSchema', () => {
  it('parses systemVar with usageId in chat and root level', () => {
    const raw = {
      app: { id: 'app-1', name: 'Test App' },
      chat: { chatId: 'chat-1', uid: 'user-1', usageId: 'usage-123' },
      invokeToken: 'test-token',
      time: '2025-01-01T00:00:00Z',
      usageId: 'usage-123'
    };

    const parsed = SystemVarSchema.parse(raw);

    expect(parsed.chat.usageId).toBe('usage-123');
    expect(parsed.usageId).toBe('usage-123');
  });

  it('parses systemVar without usageId', () => {
    const raw = {
      app: { id: 'app-1', name: 'Test App' },
      chat: { chatId: 'chat-1' },
      invokeToken: 'test-token',
      time: '2025-01-01T00:00:00Z'
    };

    const parsed = SystemVarSchema.parse(raw);

    expect(parsed.chat.usageId).toBeUndefined();
    expect(parsed.usageId).toBeUndefined();
  });
});
