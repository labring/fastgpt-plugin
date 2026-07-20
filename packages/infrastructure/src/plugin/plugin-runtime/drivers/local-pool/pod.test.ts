import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { InvokePort } from '@domain/ports/invoke.port';
import type { PluginPermissionEnumType } from '@domain/value-objects/permission.vo';
import { PluginRuntimeModeEnum } from '@domain/value-objects/plugin.vo';
import { failureResult, successResult } from '@domain/value-objects/result.vo';

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

  it('starts with restricted filesystem, process, and environment permissions', async () => {
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
});

function getBufferedIncomingStreamCount(pod: PluginPod): number {
  const channel = (
    pod as unknown as {
      channel: { bufferedIncomingStreams: Map<string, unknown[]> } | null;
    }
  ).channel;
  return channel?.bufferedIncomingStreams.size ?? 0;
}
