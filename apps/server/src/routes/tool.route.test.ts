import { describe, expect, it, vi } from 'vitest';

import { StreamData } from '@domain/value-objects/stream.vo';
import type { ToolStreamMessageType } from '@domain/value-objects/tool.vo';

import { makeToolRoute } from './tool.route';

describe('tool route', () => {
  it('returns tool errors to the client without logging them as system errors', async () => {
    const stream = StreamData.create<ToolStreamMessageType>();
    stream.send({ type: 'error', data: 'Invalid URL' });
    stream.close();

    const logger = createLogger();
    const app = makeToolRoute({
      logger,
      toolManager: createToolManager(vi.fn().mockResolvedValue([stream, null]))
    });

    const response = await app.request('/tool/runStream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createToolInput())
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Invalid URL');
    expect(logger.error).not.toHaveBeenCalledWith('Tool Stream Error', expect.anything());
    expect(logger.debug).toHaveBeenCalledWith(
      'Tool Returned Error',
      expect.objectContaining({
        message: 'Invalid URL'
      })
    );
  });

  it('logs stream transport failures as system errors', async () => {
    const stream = StreamData.create<ToolStreamMessageType>();
    stream.fail(new Error('stream connection lost'));

    const logger = createLogger();
    const app = makeToolRoute({
      logger,
      toolManager: createToolManager(vi.fn().mockResolvedValue([stream, null]))
    });

    const response = await app.request('/tool/runStream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createToolInput())
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('stream connection lost');
    expect(logger.error).toHaveBeenCalledWith(
      'Tool Stream Consume Error',
      expect.objectContaining({
        error: expect.any(Error)
      })
    );
  });
});

function createToolInput() {
  return {
    pluginId: 'fetch-url',
    input: { url: 'not-a-url' },
    systemVar: {
      app: { id: 'app', name: 'app' },
      chat: { chatId: 'chat' },
      invokeToken: 'token',
      time: '2026-01-01T00:00:00Z'
    }
  };
}

function createToolManager(run: ReturnType<typeof vi.fn>) {
  return {
    run,
    list: vi.fn(),
    detail: vi.fn()
  } as never;
}

function createLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  };
}
