import { describe, expect, it, vi } from 'vitest';

import { failureResult, successResult } from '@domain/value-objects/result.vo';
import { StreamData } from '@domain/value-objects/stream.vo';

import { CompositePluginRuntimeManager } from './composite-runtime.manager';

const uniqueId = { pluginId: 'plugin', version: '1.0.0', etag: 'etag' };

function manager(name: string) {
  return {
    register: vi.fn(async () => successResult({ name })),
    unregister: vi.fn(async () => successResult({ name })),
    getConfig: vi.fn(async () => successResult({ runtime: name })),
    updateConfig: vi.fn(async () => successResult({ name })),
    resetConfig: vi.fn(async () => successResult({ name })),
    status: vi.fn(async () => successResult({ name })),
    globalStatus: vi.fn(async () => successResult({ name })),
    shutdown: vi.fn(async () => successResult({ name })),
    invoke: vi.fn(async () => successResult(name === 'debug' ? StreamData.create() : { name }))
  };
}

describe('CompositePluginRuntimeManager', () => {
  it('preserves LocalPool as the default primary and routes lifecycle methods to it', async () => {
    const primary = manager('localPool');
    const coworkerd = manager('coworkerd');
    const debug = manager('debug');
    const composite = new CompositePluginRuntimeManager({ primary: primary as never, coworkerd: coworkerd as never, debug: debug as never });
    expect((await composite.register(uniqueId))[0]).toEqual({ name: 'localPool' });
    expect((await composite.getConfig('plugin'))[0]).toEqual({ runtime: 'localPool' });
    expect((await composite.status(uniqueId))[0]).toEqual({ name: 'localPool' });
    await composite.updateConfig('plugin', { x: 1 });
    await composite.resetConfig('plugin');
    await composite.unregister(uniqueId);
    await composite.globalStatus();
    await composite.shutdown();
    expect(primary.register).toHaveBeenCalledOnce();
    expect(coworkerd.register).not.toHaveBeenCalled();
  });

  it('selects Coworkerd as the global primary without runtime fallback', async () => {
    const primary = manager('localPool');
    const coworkerd = manager('coworkerd');
    const debug = manager('debug');
    const composite = new CompositePluginRuntimeManager({ primary: primary as never, coworkerd: coworkerd as never, debug: debug as never, mode: 'coworkerd' });
    expect((await composite.invoke({ uniqueId, eventName: 'run', payload: {}, returnStream: false }))[0]).toEqual({ name: 'coworkerd' });
    expect(coworkerd.invoke).toHaveBeenCalledOnce();
    expect(primary.invoke).not.toHaveBeenCalled();
    coworkerd.invoke.mockResolvedValueOnce(failureResult(new Error('remote failed')) as never);
    expect((await composite.invoke({ uniqueId, eventName: 'run', payload: {}, returnStream: false }))[1]).not.toBeNull();
    expect(primary.invoke).not.toHaveBeenCalled();
  });

  it('always sends debug invocations to the debug runtime before primary selection', async () => {
    for (const mode of ['primary', 'coworkerd'] as const) {
      const primary = manager('localPool');
      const coworkerd = manager('coworkerd');
      const debug = manager('debug');
      const composite = new CompositePluginRuntimeManager({ primary: primary as never, coworkerd: coworkerd as never, debug: debug as never, mode });
      await composite.invoke({ uniqueId, eventName: 'run', payload: {}, returnStream: true, options: { debug: { userId: 'u' } } });
      expect(debug.invoke).toHaveBeenCalledOnce();
      expect(primary.invoke).not.toHaveBeenCalled();
      expect(coworkerd.invoke).not.toHaveBeenCalled();
    }
  });

  it('does not construct silently when the explicitly selected driver is missing', () => {
    const primary = manager('localPool');
    const debug = manager('debug');
    expect(() => new CompositePluginRuntimeManager({ primary: primary as never, debug: debug as never, mode: 'coworkerd' })).toThrow(/requires a Coworkerd/);
    expect(() => new CompositePluginRuntimeManager({ debug: debug as never })).toThrow(/requires a primary/);
  });

  it('constructs in Coworkerd-only mode without creating or retaining LocalPool', async () => {
    const coworkerd = manager('coworkerd');
    const debug = manager('debug');
    const composite = new CompositePluginRuntimeManager({ coworkerd: coworkerd as never, debug: debug as never, mode: 'coworkerd' });
    await composite.register(uniqueId);
    expect(coworkerd.register).toHaveBeenCalledOnce();
  });
});
