import { describe, expect, it } from 'vitest';

import { makePluginServiceFeatureRoute } from './plugin-service-feature.route';

describe('plugin service feature route', () => {
  it('returns remote debug as disabled', async () => {
    const app = makePluginServiceFeatureRoute({
      remoteDebugEnabled: false
    });

    const response = await app.request('/plugin/features');
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      data: {
        remoteDebug: false
      }
    });
  });

  it('returns remote debug as enabled', async () => {
    const app = makePluginServiceFeatureRoute({
      remoteDebugEnabled: true
    });

    const response = await app.request('/plugin/features');
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      data: {
        remoteDebug: true
      }
    });
  });
});
