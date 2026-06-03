import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { InvokePort } from '@domain/ports/invoke.port';
import { PluginRuntimeModeEnum } from '@domain/value-objects/plugin.vo';
import { failureResult } from '@domain/value-objects/result.vo';

import { PluginPod } from './pod';

const echoChildPath = fileURLToPath(new URL('./test/fixtures/echo-child.js', import.meta.url));
const activePods: PluginPod[] = [];

function createPod(callbacks: ConstructorParameters<typeof PluginPod>[1]['callbacks'] = {}) {
  const pod = new PluginPod('pod-test', {
    pluginPath: echoChildPath,
    podTimeout: 1000,
    maxRequests: 10,
    maxConcurrentRequests: 1,
    pluginPermissions: [],
    getInvokeSession: () => undefined,
    callbacks
  });
  activePods.push(pod);
  return pod;
}

function createPodWithInvokeSession(invokeSession: InvokePort) {
  const pod = new PluginPod('pod-test', {
    pluginPath: echoChildPath,
    podTimeout: 1000,
    maxRequests: 10,
    maxConcurrentRequests: 1,
    pluginPermissions: [],
    getInvokeSession: () => invokeSession,
    callbacks: {}
  });
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
      method: 'run'
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
      message: 'upstream user info unavailable'
    });
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
