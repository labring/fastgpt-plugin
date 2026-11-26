import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  InvokeChatCompletionOutputType,
  InvokeChatCompletionReplyMetaType,
  InvokePort
} from '@domain/ports/invoke.port';
import type { PluginPermissionEnumType } from '@domain/value-objects/permission.vo';
import { PluginRuntimeModeEnum } from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { StreamData } from '@domain/value-objects/stream.vo';

import { PluginPod } from './pod';

const echoChildPath = fileURLToPath(new URL('./test/fixtures/echo-child.js', import.meta.url));
const activePods: PluginPod[] = [];

type TestPodOptions = ConstructorParameters<typeof PluginPod>[1] & {
  maxOldSpaceSizeMb: number;
  terminationGracePeriod: number;
};

function createPod(
  callbacks: ConstructorParameters<typeof PluginPod>[1]['callbacks'] = {},
  overrides: Partial<TestPodOptions> = {}
) {
  const options: TestPodOptions = {
    pluginPath: echoChildPath,
    podTimeout: 1000,
    maxRequests: 10,
    maxConcurrentRequests: 1,
    maxOldSpaceSizeMb: 128,
    terminationGracePeriod: 30,
    pluginPermissions: [],
    getInvokeSession: () => undefined,
    callbacks,
    ...overrides
  };
  const pod = new PluginPod('pod-test', options);
  activePods.push(pod);
  return pod;
}

function createPodWithInvokeSession(
  invokeSession: InvokePort,
  pluginPermissions: PluginPermissionEnumType[] = ['userInfo:read']
) {
  const options: TestPodOptions = {
    pluginPath: echoChildPath,
    podTimeout: 1000,
    maxRequests: 10,
    maxConcurrentRequests: 1,
    maxOldSpaceSizeMb: 128,
    terminationGracePeriod: 30,
    pluginPermissions,
    getInvokeSession: () => invokeSession,
    callbacks: {}
  };
  const pod = new PluginPod('pod-test', options);
  activePods.push(pod);
  return pod;
}

describe('PluginPod', () => {
  afterEach(async () => {
    for (const pod of activePods.splice(0)) {
      pod.kill('SIGKILL');
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  it('starts a child process and invokes a plugin method over IPC', async () => {
    const onReady = vi.fn();
    const pod = createPod({ onReady });

    await pod.start();

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(pod.isAvailable()).toBe(true);

    const result = await pod.invoke<
      { value: number },
      { method: string; params: { value: number }; envMode: string },
      false
    >({
      eventName: 'run',
      payload: { value: 1 },
      returnStream: false,
      options: { timeout: 1000 }
    });

    expect(result).toEqual({
      method: 'run',
      params: { value: 1 },
      envMode: PluginRuntimeModeEnum.localPool
    });
    expect(pod.getInfo().requestsExecuted).toBe(1);
    expect(pod.isAvailable()).toBe(true);
  });

  it('applies the configured network permission', async () => {
    process.env.LOCAL_POOL_PARENT_SECRET = 'must-not-be-inherited';
    const pod = createPod();

    try {
      await pod.start();

      const result = await pod.invoke<
        { mode: string; deniedPath: string },
        {
          cwd: string;
          execArgv: string[];
          home?: string;
          tmpdir?: string;
          parentSecret?: string;
          scratchWrite: string;
          deniedReadErrorCode?: string;
          childProcessErrorCode?: string;
        },
        false
      >({
        eventName: 'run',
        payload: {
          mode: 'security-context',
          deniedPath: path.join(process.cwd(), 'package.json')
        },
        returnStream: false,
        options: { timeout: 1000 }
      });

      expect(result).toMatchObject({
        cwd: path.dirname(echoChildPath),
        parentSecret: undefined,
        scratchWrite: 'ok',
        deniedReadErrorCode: 'ERR_ACCESS_DENIED',
        childProcessErrorCode: 'ERR_ACCESS_DENIED'
      });
      expect(result.home).toMatch(/[/\\]pods[/\\]pod-test[/\\]home$/);
      expect(result.tmpdir).toMatch(/[/\\]pods[/\\]pod-test[/\\]tmp$/);
      expect(result.execArgv).toEqual(
        expect.arrayContaining([
          '--permission',
          '--max-old-space-size=128',
          expect.stringMatching(/^--allow-fs-read=/),
          expect.stringMatching(/^--allow-fs-write=/)
        ])
      );
      if (process.env.POOL_SERVICE_POD_ALLOW_NET === 'true') {
        expect(result.execArgv).toContain('--allow-net');
      } else {
        expect(result.execArgv).not.toContain('--allow-net');
      }
    } finally {
      delete process.env.LOCAL_POOL_PARENT_SECRET;
    }
  });

  it('force kills a pod that ignores graceful termination', async () => {
    let resolveExit: ((payload: { signal: string | null }) => void) | undefined;
    const exited = new Promise<{ signal: string | null }>((resolve) => {
      resolveExit = resolve;
    });
    const pod = createPod({
      onExit: ({ signal }) => resolveExit?.({ signal })
    });

    await pod.start();
    await pod.invoke({
      eventName: 'run',
      payload: { mode: 'ignore-sigterm' },
      returnStream: false,
      options: { timeout: 1000 }
    });
    pod.kill();

    const exit = await Promise.race([
      exited,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Pod did not exit after termination grace period')), 300)
      )
    ]);
    expect(exit.signal).toBe('SIGKILL');
  });

  it('marks timed out requests and reports the timeout callback', async () => {
    const onTimeout = vi.fn();
    const pod = createPod({ onTimeout });

    await pod.start();

    await expect(
      pod.invoke({
        eventName: 'run',
        payload: { mode: 'timeout' },
        returnStream: false,
        options: { timeout: 30 }
      })
    ).rejects.toMatchObject({
      code: 'REQUEST_TIMEOUT',
      method: 'run',
      message: 'Plugin invocation timed out after 30ms while handling event "run"',
      timeoutMs: 30
    });

    expect(onTimeout).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'run'
      })
    );
  });

  it('keeps a streaming request active until the output stream ends', async () => {
    const pod = createPod();

    await pod.start();

    const stream = await pod.invoke<{ mode: string }, { value: string }, true>({
      eventName: 'run',
      payload: { mode: 'slow-stream' },
      returnStream: true,
      options: { timeout: 1000 }
    });

    expect(pod.getInfo()).toMatchObject({
      status: 'running',
      activeRequests: 1
    });

    stream.onEnd(() => pod.completeStreamRequest()).onError(() => pod.completeStreamRequest());

    const chunks: { value: string }[] = [];
    await stream.consume((chunk) => {
      chunks.push(chunk);
    });

    expect(chunks).toEqual([{ value: 'chunk' }]);
    expect(pod.getInfo()).toMatchObject({
      status: 'idle',
      activeRequests: 0
    });
  });

  it('keeps reverse invocation nested error messages over IPC', async () => {
    const userInfo = vi.fn(async () =>
      failureResult(
        {
          en: 'Host user info failed',
          'zh-CN': '宿主用户信息失败'
        },
        new Error('upstream user info unavailable')
      )
    );
    const pod = createPodWithInvokeSession({
      userInfo
    } as unknown as InvokePort);

    await pod.start();

    const result = await pod.invoke<
      { mode: string },
      Awaited<ReturnType<InvokePort['userInfo']>>,
      false
    >({
      eventName: 'run',
      payload: { mode: 'reverse-invoke-error' },
      returnStream: false,
      options: {
        timeout: 1000,
        invocationId: 'invoke-session-id'
      }
    });

    const [, err] = result;

    expect(userInfo).toHaveBeenCalledTimes(1);
    expect(err).toMatchObject({
      reason: {
        'zh-CN': '宿主用户信息失败'
      }
    });
    expect(err?.error).toBeInstanceOf(Error);
    expect(err?.error).toMatchObject({
      message: 'Host user info failed',
      reason: {
        en: 'Host user info failed',
        'zh-CN': '宿主用户信息失败'
      },
      cause: expect.objectContaining({
        message: 'upstream user info unavailable'
      })
    });
  });

  it('denies reverse invocation when the plugin permission is missing', async () => {
    const userInfo = vi.fn(async () =>
      successResult({
        username: 'Ada',
        orgs: [],
        groups: []
      })
    );
    const pod = createPodWithInvokeSession(
      {
        userInfo
      } as unknown as InvokePort,
      []
    );

    await pod.start();

    const result = await pod.invoke<
      { mode: string },
      Awaited<ReturnType<InvokePort['userInfo']>>,
      false
    >({
      eventName: 'run',
      payload: { mode: 'reverse-invoke-error' },
      returnStream: false,
      options: {
        timeout: 1000,
        invocationId: 'invoke-session-id'
      }
    });

    const [, err] = result;

    expect(userInfo).not.toHaveBeenCalled();
    expect(err).toMatchObject({
      reason: {
        en: 'Plugin permission "userInfo:read" is required',
        'zh-CN': '插件需要 "userInfo:read" 权限'
      }
    });
  });

  it('uses teamInfo:read for WeCom corp token access', async () => {
    const getWecomCorpToken = vi.fn(async () =>
      successResult({
        access_token: 'test-token',
        expires_in: 7200
      })
    );
    const pod = createPodWithInvokeSession(
      {
        getWecomCorpToken
      } as unknown as InvokePort,
      ['teamInfo:read']
    );

    await pod.start();

    const result = await pod.invoke<
      { mode: string; reverseMethod: string },
      Awaited<ReturnType<InvokePort['getWecomCorpToken']>>,
      false
    >({
      eventName: 'run',
      payload: {
        mode: 'reverse-invoke',
        reverseMethod: 'wecomCorpToken'
      },
      returnStream: false,
      options: {
        timeout: 1000,
        invocationId: 'invoke-session-id'
      }
    });

    expect(getWecomCorpToken).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        access_token: 'test-token',
        expires_in: 7200
      },
      null
    ]);
  });

  it('discards upload input when file-upload permission is missing', async () => {
    const uploadFile = vi.fn();
    const pod = createPodWithInvokeSession(
      {
        uploadFile
      } as unknown as InvokePort,
      []
    );

    await pod.start();

    const result = await pod.invoke<
      { mode: string; reverseMethod: string },
      Awaited<ReturnType<InvokePort['uploadFile']>>,
      false
    >({
      eventName: 'run',
      payload: {
        mode: 'reverse-invoke',
        reverseMethod: 'uploadFile'
      },
      returnStream: false,
      options: {
        timeout: 1000,
        invocationId: 'invoke-session-id'
      }
    });
    await new Promise((resolve) => setImmediate(resolve));

    const [, err] = result;
    expect(uploadFile).not.toHaveBeenCalled();
    expect(err).toMatchObject({
      reason: {
        en: 'Plugin permission "file-upload:allow" is required',
        'zh-CN': '插件需要 "file-upload:allow" 权限'
      }
    });
    expect(getBufferedIncomingStreamCount(pod)).toBe(0);
  });

  it('forwards child stdio as chunks instead of splitting lines', async () => {
    const onStdout = vi.fn();
    const onStderr = vi.fn();
    const pod = createPod({ onStdout, onStderr });

    await pod.start();

    await pod.invoke({
      eventName: 'run',
      payload: { mode: 'stdio-chunk' },
      returnStream: false,
      options: { timeout: 1000 }
    });

    await vi.waitFor(() => {
      expect(onStdout).toHaveBeenCalledWith('stdout-first\nstdout-second\n');
      expect(onStderr).toHaveBeenCalledWith('stderr-first\nstderr-second\n');
    });
  });

  it('forwards proxy environment variables to the child process', async () => {
    process.env.HTTP_PROXY = 'http://127.0.0.1:8080';
    process.env.HTTPS_PROXY = 'https://127.0.0.1:8443';
    process.env.NO_PROXY = 'localhost,127.0.0.1';
    process.env.ALL_PROXY = 'socks5://127.0.0.1:1080';

    try {
      const pod = createPod();
      await pod.start();

      const result = await pod.invoke<
        {
          mode: string;
        },
        {
          httpProxy?: string;
          httpsProxy?: string;
          noProxy?: string;
          allProxy?: string;
        },
        false
      >({
        eventName: 'run',
        payload: {
          mode: 'security-context'
        },
        returnStream: false,
        options: { timeout: 1000 }
      });

      expect(result.httpProxy).toBe('http://127.0.0.1:8080');
      expect(result.httpsProxy).toBe('https://127.0.0.1:8443');
      expect(result.noProxy).toBe('localhost,127.0.0.1');
      expect(result.allProxy).toBe('socks5://127.0.0.1:1080');
    } finally {
      delete process.env.HTTP_PROXY;
      delete process.env.HTTPS_PROXY;
      delete process.env.NO_PROXY;
      delete process.env.ALL_PROXY;
    }
  });

  it('denies chatCompletion when model:invoke permission is missing', async () => {
    const chatCompletion = vi.fn();
    const pod = createPodWithInvokeSession(
      {
        chatCompletion
      } as unknown as InvokePort,
      ['userInfo:read']
    );

    await pod.start();

    const result = await pod.invoke<
      { mode: string; reverseMethod: string; reverseArgs: unknown },
      Result<InvokeChatCompletionReplyMetaType>,
      false
    >({
      eventName: 'run',
      payload: {
        mode: 'reverse-invoke',
        reverseMethod: 'chatCompletion',
        reverseArgs: {
          body: {
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'hello' }]
          }
        }
      },
      returnStream: false,
      options: {
        timeout: 1000,
        invocationId: 'invoke-session-id'
      }
    });

    const [, err] = result;
    expect(chatCompletion).not.toHaveBeenCalled();
    expect(err).toMatchObject({
      reason: {
        en: 'Plugin permission "model:invoke" is required',
        'zh-CN': '插件需要 "model:invoke" 权限'
      }
    });
  });

  it('proxies non-streaming chatCompletion responses when model:invoke permission is granted', async () => {
    const chatCompletion = vi.fn(async () =>
      successResult({
        status: 400,
        headers: { 'content-type': 'application/json' },
        body: { error: { message: 'Model disabled' } }
      })
    );
    const pod = createPodWithInvokeSession(
      {
        chatCompletion
      } as unknown as InvokePort,
      ['model:invoke']
    );

    await pod.start();

    const result = await pod.invoke<
      { mode: string; reverseMethod: string; reverseArgs: unknown },
      Result<InvokeChatCompletionReplyMetaType>,
      false
    >({
      eventName: 'run',
      payload: {
        mode: 'reverse-invoke',
        reverseMethod: 'chatCompletion',
        reverseArgs: {
          body: {
            model: 'disabled-model',
            messages: [{ role: 'user', content: 'hello' }]
          }
        }
      },
      returnStream: false,
      options: {
        timeout: 1000,
        invocationId: 'invoke-session-id'
      }
    });

    expect(chatCompletion).toHaveBeenCalledWith(
      {
        body: {
          model: 'disabled-model',
          messages: [{ role: 'user', content: 'hello' }]
        }
      },
      {
        signal: expect.any(AbortSignal)
      }
    );
    expect(result).toEqual([
      {
        status: 400,
        headers: { 'content-type': 'application/json' },
        body: { error: { message: 'Model disabled' } }
      },
      null
    ]);
  });

  it('streams chatCompletion SSE output over IPC via createReply when model:invoke is granted', async () => {
    const encoder = new TextEncoder();
    const chatCompletion = vi.fn(async () => {
      const stream = StreamData.create<Uint8Array>();
      setTimeout(() => {
        stream.write(encoder.encode('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'));
        stream.write(encoder.encode('data: [DONE]\n\n'));
        stream.end();
      }, 10);

      return successResult({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        stream
      });
    });

    const pod = createPodWithInvokeSession(
      {
        chatCompletion
      } as unknown as InvokePort,
      ['model:invoke']
    );

    await pod.start();

    const result = await pod.invoke<
      { mode: string; reverseMethod: string; reverseArgs: unknown },
      {
        meta: Result<InvokeChatCompletionReplyMetaType>;
        chunks: string[];
        streamError: unknown;
      },
      false
    >({
      eventName: 'run',
      payload: {
        mode: 'reverse-invoke',
        reverseMethod: 'chatCompletion',
        reverseArgs: {
          body: {
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'hello' }],
            stream: true
          }
        }
      },
      returnStream: false,
      options: {
        timeout: 1000,
        invocationId: 'invoke-session-id'
      }
    });

    expect(chatCompletion).toHaveBeenCalledTimes(1);
    expect(result.meta).toEqual([
      {
        status: 200,
        headers: { 'content-type': 'text/event-stream' }
      },
      null
    ]);
    expect(result.chunks).toEqual([
      'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n',
      'data: [DONE]\n\n'
    ]);
    expect(result.streamError).toBeNull();
    expect(pod.isAvailable()).toBe(true);
  });

  it('forwards upstream chatCompletion stream errors over IPC without killing the pod', async () => {
    const encoder = new TextEncoder();
    const chatCompletion = vi.fn(async () => {
      const stream = StreamData.create<Uint8Array>();
      stream.toReadable().on('error', () => {});
      setTimeout(() => {
        stream.write(encoder.encode('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n'));
        setTimeout(() => {
          stream.fail(new Error('upstream SSE interrupted'));
        }, 15);
      }, 10);

      return successResult({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        stream
      });
    });

    const pod = createPodWithInvokeSession(
      {
        chatCompletion
      } as unknown as InvokePort,
      ['model:invoke']
    );

    await pod.start();

    const result = await pod.invoke<
      { mode: string; reverseMethod: string; reverseArgs: unknown },
      {
        meta: Result<InvokeChatCompletionReplyMetaType>;
        chunks: string[];
        streamError: { message?: string } | null;
      },
      false
    >({
      eventName: 'run',
      payload: {
        mode: 'reverse-invoke',
        reverseMethod: 'chatCompletion',
        reverseArgs: {
          body: {
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'hello' }],
            stream: true
          }
        }
      },
      returnStream: false,
      options: {
        timeout: 1000,
        invocationId: 'invoke-session-id'
      }
    });

    expect(result.chunks).toEqual(['data: {"choices":[{"delta":{"content":"partial"}}]}\n\n']);
    expect(result.streamError).toMatchObject({
      message: 'upstream SSE interrupted'
    });
    expect(pod.isAvailable()).toBe(true);
  });

  it('passes PLUGIN_IPC_TIMEOUT_MS matching podTimeout into the child process env', async () => {
    const pod = createPod({}, { podTimeout: 45_000 });

    await pod.start();

    const result = await pod.invoke<
      { mode: string },
      { pluginIpcTimeoutMs?: string },
      false
    >({
      eventName: 'run',
      payload: {
        mode: 'security-context'
      },
      returnStream: false,
      options: { timeout: 1000 }
    });

    expect(result.pluginIpcTimeoutMs).toBe('45000');
  });

  it('aborts in-flight chatCompletion AbortSignal when the pod channel closes', async () => {
    let capturedSignal: AbortSignal | undefined;
    let resolveStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      resolveStarted = resolve;
    });

    const chatCompletion = vi.fn(
      (_input: unknown, options?: { signal?: AbortSignal }) =>
        new Promise<Result<InvokeChatCompletionOutputType>>((_resolve, reject) => {
          capturedSignal = options?.signal;
          resolveStarted();
          options?.signal?.addEventListener('abort', () => {
            reject(new Error('aborted'));
          });
        })
    );

    const pod = createPodWithInvokeSession(
      {
        chatCompletion
      } as unknown as InvokePort,
      ['model:invoke']
    );

    await pod.start();

    const invokePromise = pod.invoke<
      { mode: string; reverseMethod: string; reverseArgs: unknown },
      unknown,
      false
    >({
      eventName: 'run',
      payload: {
        mode: 'reverse-invoke',
        reverseMethod: 'chatCompletion',
        reverseArgs: {
          body: {
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'hang' }]
          }
        }
      },
      returnStream: false,
      options: {
        timeout: 5000,
        invocationId: 'invoke-session-id'
      }
    });

    await started;
    expect(capturedSignal?.aborted).toBe(false);

    pod.kill('SIGKILL');
    await expect(invokePromise).rejects.toThrow();

    await vi.waitFor(() => {
      expect(capturedSignal?.aborted).toBe(true);
    });
  });
});

function getBufferedIncomingStreamCount(pod: PluginPod): number {
  const channel = (
    pod as unknown as {
      channel: { bufferedIncomingStreams: Map<string, unknown[]> } | null;
    }
  ).channel;
  return channel?.bufferedIncomingStreams.size ?? 0;
}
