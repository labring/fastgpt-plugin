import { fileURLToPath } from 'node:url';

import { PluginRuntimeModeEnum } from '@domain/value-objects/plugin.vo';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
});
