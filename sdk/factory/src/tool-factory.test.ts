import type { ToolStreamMessageType } from '@domain/value-objects/tool.vo';
import { afterEach, describe, expect, it } from 'vitest';
import z from 'zod';

import {
  createLocalDebugRuntime,
  setCurrentLocalDebugRuntime
} from '../../../apps/cli/src/debug/runtime';
import { createToolHandler, defineTool } from './index';

describe('ToolFactory streaming', () => {
  const previousRuntimeMode = process.env.RUNTIME_MODE;

  afterEach(() => {
    setCurrentLocalDebugRuntime(undefined);
    if (previousRuntimeMode === undefined) {
      delete process.env.RUNTIME_MODE;
    } else {
      process.env.RUNTIME_MODE = previousRuntimeMode;
    }
  });

  it('returns the output stream before the handler completes', async () => {
    const runtime = createLocalDebugRuntime();
    setCurrentLocalDebugRuntime(runtime);
    process.env.RUNTIME_MODE = 'dev';

    let finishHandler!: () => void;
    const handlerCanFinish = new Promise<void>((resolve) => {
      finishHandler = resolve;
    });

    defineTool({
      manifest: {
        pluginId: 'stream-test',
        name: { en: 'Stream Test', 'zh-CN': '流式测试' },
        description: { en: 'Stream Test', 'zh-CN': '流式测试' },
        version: '0.0.1',
        versionDescription: { en: 'Test version', 'zh-CN': '测试版本' },
        tags: ['tools']
      },
      handler: createToolHandler({
        inputSchema: z.object({}),
        outputSchema: z.object({
          ok: z.boolean()
        }),
        handler: async (_input, ctx) => {
          ctx.streamResponse({
            type: 'answer',
            content: 'first chunk'
          });
          await handlerCanFinish;

          return {
            ok: true
          };
        }
      })
    });

    await runtime.waitUntilReady();

    const responsePromise = runtime.invokePlugin<
      {
        input: Record<string, unknown>;
        systemVar: Record<string, unknown>;
      },
      void,
      never,
      ToolStreamMessageType
    >('run', {
      input: {},
      systemVar: {}
    });

    const timedOut = Symbol('timedOut');
    const responseOrTimeout = await Promise.race([responsePromise, delay(50).then(() => timedOut)]);

    try {
      expect(responseOrTimeout).not.toBe(timedOut);
      const response = responseOrTimeout as Awaited<typeof responsePromise>;
      expect(response.output).toBeDefined();

      const messages: ToolStreamMessageType[] = [];
      await response.output!.stream.consume(async (chunk) => {
        messages.push(chunk);
        if (messages.length === 1) {
          finishHandler();
        }
      });

      expect(messages).toEqual([
        {
          type: 'stream',
          data: {
            type: 'answer',
            content: 'first chunk'
          }
        },
        {
          type: 'response',
          data: {
            ok: true
          }
        }
      ]);
    } finally {
      finishHandler();
    }
  });
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
