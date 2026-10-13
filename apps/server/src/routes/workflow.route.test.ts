import { WorkflowContract } from '@interface-adapter/contracts/route/workflow.contract';
import { afterEach, describe, expect, it } from 'vitest';

import type { TemplateItemType } from '@domain/entities/workflow.entity';
import { createOpenAPIHono } from '@infrastructure/hono/utils/response';
import { workflows } from '@infrastructure/static-data/workflow/init';

import { makeWorkflowRoute } from './workflow.route';

const localizedTemplate = {
  templateId: 'localized-template',
  name: {
    en: 'Localized workflow',
    'zh-CN': '本地化工作流'
  },
  intro: {
    en: 'A workflow with localized text',
    'zh-CN': '包含本地化文案的工作流'
  },
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
        name: {
          en: 'Prompt',
          'zh-CN': '提示词'
        },
        intro: {
          en: 'Collect a prompt',
          'zh-CN': '收集提示词'
        },
        flowNodeType: 'chatNode',
        customNodeSetting: { mode: 'preserve' },
        inputs: [
          {
            key: 'prompt',
            label: {
              en: 'common:core.module.input.label.user question',
              'zh-CN': 'common:core.module.input.label.user question'
            },
            description: {
              en: 'Prompt description',
              'zh-CN': '提示词说明'
            },
            placeholder: {
              en: 'Enter text',
              'zh-CN': '输入文本'
            },
            toolDescription: {
              en: 'Prompt for the model',
              'zh-CN': '提供给模型的提示词'
            },
            debugLabel: {
              en: 'Prompt debug label',
              'zh-CN': '提示词调试标签'
            },
            valueDesc: {
              en: 'Prompt value',
              'zh-CN': '提示词值'
            },
            value: 'Keep this machine value',
            dynamicInputSetting: { enabled: true }
          }
        ],
        outputs: [
          {
            id: 'result',
            key: 'result',
            label: {
              en: 'Result',
              'zh-CN': '结果'
            },
            description: {
              en: 'Generated result',
              'zh-CN': '生成的结果'
            },
            valueDesc: {
              en: 'Result value',
              'zh-CN': '结果值'
            },
            valueType: 'string'
          }
        ]
      }
    ],
    edges: [{ source: 'node-1', target: 'node-2' }],
    chatConfig: { model: 'machine-model' }
  }
} satisfies Omit<TemplateItemType, 'avatar'>;

afterEach(() => {
  workflows.length = 0;
});

describe('workflow route', () => {
  it('returns localized template text unchanged without a locale request parameter', async () => {
    workflows.push(localizedTemplate);
    const app = createWorkflowApp();

    const response = await app.request('/api/workflow/list');
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      data: [
        {
          ...localizedTemplate,
          avatar: 'url:workflow/templates/localized-template/logo'
        }
      ]
    });
    expect(WorkflowContract.List.meta.path).toBe('/workflow/list');
  });

  it('documents localized response fields without query parameters in OpenAPI', async () => {
    const app = createWorkflowApp();
    app.doc31('/openapi.json', {
      openapi: '3.1.0',
      info: { title: 'Workflow API', version: '1.0.0' }
    });

    const response = await app.request('/openapi.json');
    const document = await response.json();
    const listOperationPath = ['paths', '/api/workflow/list', 'get'];
    const responseSchemaPath = [
      ...listOperationPath,
      'responses',
      '200',
      'content',
      'application/json',
      'schema'
    ];

    expect(response.status).toBe(200);
    expect(document).not.toHaveProperty([...listOperationPath, 'parameters']);
    expect(document).toHaveProperty([
      ...responseSchemaPath,
      'properties',
      'data',
      'items',
      'properties',
      'name',
      'properties',
      'en'
    ]);
    expect(document).toHaveProperty([
      ...responseSchemaPath,
      'properties',
      'data',
      'items',
      'properties',
      'workflow',
      'properties',
      'nodes',
      'items',
      'properties',
      'inputs',
      'items',
      'properties',
      'label',
      'properties',
      'zh-CN'
    ]);
  });
});

function createWorkflowApp() {
  const app = createOpenAPIHono();
  app.route(
    '/api',
    makeWorkflowRoute({
      publicRemoteFileStorageRepo: {
        getAccessUrl: async (key: string): Promise<[string, null]> => [`url:${key}`, null]
      }
    })
  );
  return app;
}
