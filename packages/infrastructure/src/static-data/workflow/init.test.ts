import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TemplateItemType } from '@domain/entities/workflow.entity';
import { TemplateItemSchema } from '@domain/entities/workflow.entity';
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

const localizedText = {
  en: 'Workflow text',
  'zh-CN': '工作流文案'
};

const localizedTemplateFields = {
  name: localizedText,
  intro: localizedText,
  tags: ['advanced'],
  type: 'advanced',
  userGuide: {
    type: 'link',
    content: 'https://example.com/guide'
  },
  workflow: {
    nodes: [
      {
        nodeId: 'node-1',
        name: localizedText,
        intro: localizedText,
        flowNodeType: 'chatNode',
        customNodeSetting: { mode: 'preserve' },
        inputs: [
          {
            key: 'prompt',
            label: localizedText,
            description: localizedText,
            placeholder: localizedText,
            toolDescription: localizedText,
            debugLabel: localizedText,
            valueDesc: localizedText,
            value: 'machine-value',
            dynamicInputSetting: { enabled: true }
          }
        ],
        outputs: [
          {
            id: 'result',
            key: 'result',
            label: localizedText,
            description: localizedText,
            valueDesc: localizedText,
            valueType: 'string'
          }
        ]
      }
    ],
    edges: [],
    chatConfig: { model: 'machine-model' }
  }
} satisfies Pick<TemplateItemType, 'name' | 'intro' | 'tags' | 'type' | 'userGuide' | 'workflow'>;

describe('workflow static data', () => {
  it('accepts i18n template copy and keeps dynamic node configuration open', () => {
    const template = {
      templateId: 'localized-template',
      avatar: 'workflow-avatar',
      ...localizedTemplateFields
    };

    expect(TemplateItemSchema.parse(template)).toEqual(template);
    expect(
      TemplateItemSchema.safeParse({
        ...template,
        workflow: {
          ...template.workflow,
          nodes: [
            {
              ...template.workflow.nodes[0],
              inputs: [{ ...template.workflow.nodes[0]?.inputs?.[0], label: 'Legacy string' }]
            }
          ]
        }
      }).success
    ).toBe(false);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    redisStore.clear();
    workflows.length = 0;
  });

  it('loads localized template data without changing its copy or machine configuration', async () => {
    const templateDirectory = await mkdtemp(path.join(tmpdir(), 'workflow-templates-'));

    try {
      const templatePath = path.join(templateDirectory, 'localized-template');
      await mkdir(templatePath);
      await writeFile(
        path.join(templatePath, 'workflow.json'),
        JSON.stringify(localizedTemplateFields)
      );
      await initWorkflowTemplates(templateDirectory);

      expect(workflows).toHaveLength(1);
      expect(workflows[0]).toEqual({
        ...localizedTemplateFields,
        templateId: 'localized-template',
        isActive: true
      });
      expect(workflows[0]?.workflow.nodes[0]?.inputs?.[0]?.value).toBe('machine-value');
      expect(workflows[0]?.workflow.chatConfig).toEqual({ model: 'machine-model' });
    } finally {
      await rm(templateDirectory, { recursive: true, force: true });
    }
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
