import { WorkflowContract } from '@interface-adapter/contracts/route/workflow.contract';
import { afterEach, describe, expect, it } from 'vitest';

import type { TemplateItemType } from '@domain/entities/workflow.entity';
import { createOpenAPIHono } from '@infrastructure/hono/utils/response';
import { workflows } from '@infrastructure/static-data/workflow/init';

import { makeWorkflowRoute } from './workflow.route';

const workflowTemplate = {
  templateId: 'sample-template',
  name: 'Sample workflow',
  intro: 'A workflow with ordinary string metadata',
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
        name: 'Prompt',
        intro: 'Collect a prompt',
        flowNodeType: 'chatNode',
        customNodeSetting: { mode: 'preserve' },
        inputs: [
          {
            key: 'prompt',
            label: 'Prompt',
            description: 'Prompt description',
            placeholder: 'Enter text',
            toolDescription: 'Prompt for the model',
            debugLabel: 'Prompt debug label',
            valueDesc: 'Prompt value',
            value: 'Keep this machine value',
            dynamicInputSetting: { enabled: true }
          }
        ],
        outputs: [
          {
            id: 'result',
            key: 'result',
            label: 'Result',
            description: 'Generated result',
            valueDesc: 'Result value',
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
  it('returns workflow template text unchanged without a locale request parameter', async () => {
    workflows.push(workflowTemplate);
    const app = createWorkflowApp();

    const response = await app.request('/api/workflow/list');
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      data: [
        {
          ...workflowTemplate,
          avatar: 'url:workflow/templates/sample-template/logo'
        }
      ]
    });
    expect(WorkflowContract.List.meta.path).toBe('/workflow/list');
  });

  it('documents string response fields without query parameters in OpenAPI', async () => {
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
    expect(document).toHaveProperty(
      [...responseSchemaPath, 'properties', 'data', 'items', 'properties', 'name', 'type'],
      'string'
    );
    expect(document).not.toHaveProperty([
      ...responseSchemaPath,
      'properties',
      'data',
      'items',
      'properties',
      'name',
      'properties',
      'en'
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
