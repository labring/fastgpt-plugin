import { describe, test, expect } from 'bun:test';
import { FastGPTPluginClient, RunToolWithStream } from './client';
import type { SystemVarType } from './client';

const baseUrl = import.meta.env.FASTGPT_PLUGIN_BASE_URL!;
const token = import.meta.env.FASTGPT_PLUGIN_TOKEN!;

const client = new FastGPTPluginClient({ baseUrl, token });
const streamRunner = new RunToolWithStream(baseUrl, token);

function createMockSystemVar(): SystemVarType {
  return {
    user: {
      id: 'test-user-id',
      username: 'testuser',
      contact: 'test@example.com',
      membername: 'Test Member',
      teamName: 'Test Team',
      teamId: 'test-team-id',
      name: 'Test User'
    },
    app: {
      id: 'test-app-id',
      name: 'Test App'
    },
    tool: {
      id: 'test-tool-id',
      version: '1.0.0'
    },
    time: new Date().toISOString()
  };
}

describe('FastGPTPluginClient', () => {
  describe('Models API', () => {
    test('listModels should return models list', async () => {
      const models = await client.listModels();
      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
    });

    test('getModelProviders should return providers', async () => {
      const result = await client.getModelProviders();
      expect(result).toBeDefined();
      expect(result.modelProviders).toBeDefined();
      expect(Array.isArray(result.modelProviders)).toBe(true);
      expect(result.aiproxyIdMap).toBeDefined();
    });
  });

  describe('Tools API', () => {
    test('listTools should return tools list', async () => {
      const tools = await client.listTools();
      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
    });

    test('getToolTags should return tags', async () => {
      const tags = await client.getToolTags();
      expect(tags).toBeDefined();
      expect(Array.isArray(tags)).toBe(true);
    });

    test('getTool should return tool detail', async () => {
      const tools = await client.listTools();
      if (tools.length === 0) {
        console.log('No tools available, skipping getTool test');
        return;
      }

      const toolId = tools[0].toolId;
      const tool = await client.getTool(toolId);
      expect(tool).toBeDefined();
      expect(tool.toolId).toBe(toolId);
    });
  });

  describe('Workflow API', () => {
    test('listWorkflows should return workflows list', async () => {
      const workflows = await client.listWorkflows();
      expect(workflows).toBeDefined();
    });
  });
});

describe('RunToolWithStream', () => {
  test('run with specific tool (getTime example)', async () => {
    const result = await streamRunner.run({
      toolId: 'getTime',
      inputs: {},
      systemVar: createMockSystemVar(),
      onMessage: (_) => {}
    });

    expect(result).toEqual({
      output: {
        time: expect.any(String)
      }
    });

    if (result.output) {
      expect(typeof result.output).toBe('object');
    }
  });
});
