import { afterEach, describe, expect, it, vi } from 'vitest';

const { createCurrentProcessPluginChannelMock } = vi.hoisted(() => ({
  createCurrentProcessPluginChannelMock: vi.fn(() => ({
    notify: vi.fn(async () => {})
  }))
}));

vi.mock('@infrastructure/plugin/plugin-runtime/drivers/channel/ipc', () => ({
  createCurrentProcessPluginChannel: createCurrentProcessPluginChannelMock
}));

import { PluginFactory, resolvePluginIpcTimeoutMs } from './plugin-factory';

class TestPluginFactory extends PluginFactory {
  public getPluginType() {
    return 'tool' as const;
  }

  public constructor() {
    super();
  }
}

describe('resolvePluginIpcTimeoutMs', () => {
  it('returns parsed positive number when PLUGIN_IPC_TIMEOUT_MS is valid', () => {
    expect(resolvePluginIpcTimeoutMs('120000')).toBe(120000);
    expect(resolvePluginIpcTimeoutMs('45000')).toBe(45000);
  });

  it('returns undefined when unset, non-numeric, non-finite, or non-positive', () => {
    expect(resolvePluginIpcTimeoutMs(undefined)).toBeUndefined();
    expect(resolvePluginIpcTimeoutMs('')).toBeUndefined();
    expect(resolvePluginIpcTimeoutMs('abc')).toBeUndefined();
    expect(resolvePluginIpcTimeoutMs('Infinity')).toBeUndefined();
    expect(resolvePluginIpcTimeoutMs('0')).toBeUndefined();
    expect(resolvePluginIpcTimeoutMs('-1000')).toBeUndefined();
  });
});

describe('PluginFactory localPool IPC timeout configuration', () => {
  const previousRuntimeMode = process.env.RUNTIME_MODE;
  const previousTimeout = process.env.PLUGIN_IPC_TIMEOUT_MS;

  afterEach(() => {
    createCurrentProcessPluginChannelMock.mockClear();
    if (previousRuntimeMode === undefined) {
      delete process.env.RUNTIME_MODE;
    } else {
      process.env.RUNTIME_MODE = previousRuntimeMode;
    }
    if (previousTimeout === undefined) {
      delete process.env.PLUGIN_IPC_TIMEOUT_MS;
    } else {
      process.env.PLUGIN_IPC_TIMEOUT_MS = previousTimeout;
    }
  });

  it('passes defaultTimeoutMs to createCurrentProcessPluginChannel when PLUGIN_IPC_TIMEOUT_MS is set', async () => {
    process.env.RUNTIME_MODE = 'localPool';
    process.env.PLUGIN_IPC_TIMEOUT_MS = '120000';

    new TestPluginFactory();
    await new Promise((resolve) => setImmediate(resolve));

    expect(createCurrentProcessPluginChannelMock).toHaveBeenCalledWith({
      defaultTimeoutMs: 120000
    });
  });

  it('falls back to channel default options when PLUGIN_IPC_TIMEOUT_MS is invalid or unset', async () => {
    process.env.RUNTIME_MODE = 'localPool';
    process.env.PLUGIN_IPC_TIMEOUT_MS = '0';

    new TestPluginFactory();
    await new Promise((resolve) => setImmediate(resolve));

    expect(createCurrentProcessPluginChannelMock).toHaveBeenCalledWith(undefined);
  });
});
