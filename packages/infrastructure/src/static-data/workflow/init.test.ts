import { beforeEach, describe, expect, it, vi } from 'vitest';

import { env } from '@infrastructure/env';

import {
  attachWorkflowAvatarUrls,
  initStaticWorkflowAssets,
  initWorkflowTemplates,
  workflows
} from './init';

const redisStore = new Map<string, string>();
const redisClient = {
  getClient: {
    get: vi.fn(async (key: string) => redisStore.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      redisStore.set(key, value);
      return 'OK';
    })
  }
};

const s3Clients = {
  internalClient: {
    uploadObject: vi.fn(async () => undefined)
  }
};

describe('workflow static data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisStore.clear();
    workflows.length = 0;
  });

  it('loads template directories and injects only workflow-level avatar URLs', async () => {
    await initWorkflowTemplates();

    const workflowTemplates = await attachWorkflowAvatarUrls(workflows, {
      getAccessUrl: vi.fn(async (key: string): Promise<[string, null]> => [`url:${key}`, null])
    });
    const chinese = workflowTemplates.find((item) => item.templateId === 'Chinese');

    expect(workflowTemplates).toHaveLength(10);
    expect(chinese?.avatar).toBe('url:workflow/templates/Chinese/logo');
    expect(chinese?.workflow.nodes[0]?.avatar).toBe('core/workflow/template/systemConfig');
  });

  it('uploads workflow logos once per static data digest', async () => {
    await initStaticWorkflowAssets({
      redisClient: redisClient as any,
      s3Clients: s3Clients as any
    });

    expect(s3Clients.internalClient.uploadObject).toHaveBeenCalledTimes(10);
    expect(s3Clients.internalClient.uploadObject).toHaveBeenCalledWith(
      expect.objectContaining({
        key: `${env.S3_FILE_BASE_PATH}/workflow/templates/Chinese/logo`,
        contentType: 'image/svg+xml',
        contentDisposition: 'inline; filename="logo.svg"'
      })
    );

    await initStaticWorkflowAssets({
      redisClient: redisClient as any,
      s3Clients: s3Clients as any
    });

    expect(s3Clients.internalClient.uploadObject).toHaveBeenCalledTimes(10);
  });
});
